import { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";
import {
  AsaasApiError,
  asaasPublicErrorMessage,
  createAsaasCustomer,
  createPixCharge,
  getPixQrCode,
} from "../lib/asaas";
import { getEnvironment } from "../config/env";

const checkoutSchema = z.object({
  bookingId: z.string(),
});

export async function paymentsRoutes(app: FastifyInstance) {
  // Criar cobrança PIX para um booking
  app.post(
    "/checkout",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { bookingId } = checkoutSchema.parse(request.body);
      const userId = (request.user as { id: string }).id;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          client: true,
          proposal: true,
          service: { select: { title: true } },
          tool: { select: { title: true } },
          payment: true,
        },
      });

      if (!booking) {
        return reply.code(404).send({ error: "Booking não encontrado" });
      }

      // Só o cliente pode iniciar o pagamento
      if (booking.clientId !== userId) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      // Só pode pagar se estiver aguardando pagamento
      if (booking.status !== "AWAITING_PAYMENT") {
        return reply.code(400).send({
          error: "Booking não está aguardando pagamento",
        });
      }

      // Não cria pagamento duplicado
      if (!booking.proposal) {
        return reply.code(400).send({
          error: "Nenhuma proposta aceita encontrada",
        });
      }

      const client = booking.client;
      const title =
        booking.service?.title || booking.tool?.title || "Serviço Serveo";
      const amount = Number(booking.proposal.amount);
      const platformFee = Math.round(amount * 0.1 * 100) / 100;
      const providerAmount = Math.round(amount * 0.9 * 100) / 100;

      const paymentResponse = (payment: {
        id: string;
        amount: unknown;
        pixKey: string | null;
        pixQrCode: string | null;
        status: string;
      }) => ({
        id: payment.id,
        amount: payment.amount,
        pixKey: payment.pixKey,
        pixQrCode: payment.pixQrCode,
        status: payment.status,
      });

      try {
        // Não cria outra cobrança quando já existe um pagamento completo.
        if (booking.payment?.pixKey && booking.payment.pixQrCode) {
          return reply.send({ payment: paymentResponse(booking.payment) });
        }

        // Se a cobrança foi criada, mas a busca do QR Code falhou, recupera a
        // mesma cobrança em vez de gerar uma duplicada.
        if (booking.payment?.asaasChargeId) {
          const qrCode = await getPixQrCode(booking.payment.asaasChargeId);
          const recoveredPayment = await prisma.payment.update({
            where: { id: booking.payment.id },
            data: {
              pixQrCode: qrCode.encodedImage,
              pixKey: qrCode.payload,
            },
          });
          return reply.send({ payment: paymentResponse(recoveredPayment) });
        }

        // Reserva o pagamento no banco antes de chamar o provedor. A relação
        // única por booking impede duas abas de criarem cobranças concorrentes.
        const paymentReservation =
          booking.payment ??
          (await prisma.payment.create({
            data: {
              bookingId: booking.id,
              amount: booking.proposal.amount,
              platformFee,
              providerAmount,
              status: "PENDING",
            },
          }));

        const createCustomer = async () => {
          const customer = await createAsaasCustomer({
            id: client.id,
            name: client.name,
            email: client.email,
            cpf: client.cpf,
            phone: client.phone,
          });

          await prisma.user.update({
            where: { id: client.id },
            data: { asaasWalletId: customer.id },
          });
          return customer.id;
        };

        let asaasCustomerId = client.asaasWalletId || (await createCustomer());
        let charge: Awaited<ReturnType<typeof createPixCharge>>;

        try {
          charge = await createPixCharge({
            customerId: asaasCustomerId,
            amount,
            description: `Serveo - ${title}`,
            externalReference: booking.id,
          });
        } catch (error) {
          // IDs do Asaas pertencem à conta e ao ambiente em que foram criados.
          // Uma migração pode deixar um ID antigo no banco; recriamos o cliente
          // uma única vez quando o provedor confirma que ele não existe.
          if (
            client.asaasWalletId &&
            error instanceof AsaasApiError &&
            error.providerStatus === 404
          ) {
            asaasCustomerId = await createCustomer();
            charge = await createPixCharge({
              customerId: asaasCustomerId,
              amount,
              description: `Serveo - ${title}`,
              externalReference: booking.id,
            });
          } else {
            throw error;
          }
        }

        // Persiste o ID externo antes de buscar o QR Code. Se a segunda chamada
        // falhar, a próxima tentativa continua a cobrança já criada.
        const paymentWithCharge = await prisma.payment.update({
          where: { id: paymentReservation.id },
          data: { asaasChargeId: charge.id },
        });

        const qrCode = await getPixQrCode(charge.id);
        const payment = await prisma.payment.update({
          where: { id: paymentWithCharge.id },
          data: {
            pixQrCode: qrCode.encodedImage,
            pixKey: qrCode.payload,
          },
        });

        return reply.code(201).send({
          payment: paymentResponse(payment),
        });
      } catch (error) {
        request.log.error(
          {
            err: error,
            bookingId: booking.id,
            provider:
              error instanceof AsaasApiError
                ? {
                    status: error.providerStatus,
                    errors: error.providerErrors,
                  }
                : undefined,
          },
          "Falha ao gerar cobrança PIX",
        );
        return reply.code(502).send({
          error: asaasPublicErrorMessage(error),
        });
      }
    },
  );

  // Webhook do Asaas — chamado quando o PIX é pago
  app.post("/webhook", async (request, reply) => {
    // Valida o token do webhook
    const token = request.headers["asaas-access-token"] as string;

    const webhookToken = getEnvironment().ASAAS_WEBHOOK_TOKEN;

    if (!webhookToken || token !== webhookToken) {
      return reply.code(401).send({ error: "Token inválido" });
    }

    const event = request.body as any;
    console.log("Webhook recebido:", event.event);

    // Quando o PIX é confirmado
    if (
      event.event === "PAYMENT_RECEIVED" ||
      event.event === "PAYMENT_CONFIRMED"
    ) {
      const asaasChargeId = event.payment?.id;

      if (!asaasChargeId) {
        return reply.send({ received: true });
      }

      // Busca o pagamento pelo ID do Asaas
      const payment = await prisma.payment.findUnique({
        where: { asaasChargeId },
        include: { booking: true },
      });

      if (!payment) {
        return reply.send({ received: true });
      }

      // Atualiza pagamento e booking numa transação
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "HELD",
            paidAt: new Date(),
          },
        });

        await tx.booking.update({
          where: { id: payment.booking.id },
          data: { status: "IN_PROGRESS" },
        });
      });

      console.log(`Pagamento ${payment.id} confirmado — booking em andamento`);
    }

    return reply.send({ received: true });
  });

  // Liberar pagamento pro profissional (após conclusão)
  app.post(
    "/:id/release",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request.user as { id: string }).id;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          booking: {
            include: {
              reviews: true,
              service: { select: { userId: true } },
              tool: { select: { userId: true } },
            },
          },
        },
      });

      if (!payment) {
        return reply.code(404).send({ error: "Pagamento não encontrado" });
      }

      // Só o cliente pode liberar
      if (payment.booking.clientId !== userId) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      // Só libera se o booking estiver concluído
      if (payment.booking.status !== "COMPLETED") {
        return reply.code(400).send({
          error:
            "O serviço precisa estar concluído antes de liberar o pagamento",
        });
      }

      // Verifica se ambos avaliaram
      const reviews = payment.booking.reviews;
      const clientReview = reviews.find(
        (r) => r.authorId === payment.booking.clientId,
      );
      const providerId =
        payment.booking.service?.userId || payment.booking.tool?.userId;
      const providerReview = reviews.find((r) => r.authorId === providerId);

      if (!clientReview || !providerReview) {
        return reply.code(400).send({
          error:
            "Ambas as partes precisam avaliar antes de liberar o pagamento",
        });
      }

      // Libera o pagamento
      await prisma.payment.update({
        where: { id },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
        },
      });

      return reply.send({
        message: "Pagamento liberado para o profissional com sucesso",
      });
    },
  );
}
