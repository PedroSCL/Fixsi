import { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";
import {
  createAsaasCustomer,
  createPixCharge,
  getPixQrCode,
} from "../lib/asaas";

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
      if (booking.payment) {
        return reply.send({ payment: booking.payment });
      }

      // Proposta aceita é obrigatória para ter o valor
      if (!booking.proposal) {
        return reply.code(400).send({
          error: "Nenhuma proposta aceita encontrada",
        });
      }

      const client = booking.client;

      // Cria ou recupera o cliente no Asaas
      let asaasCustomerId = client.asaasWalletId;

      if (!asaasCustomerId) {
        const customer = await createAsaasCustomer({
          name: client.name,
          email: client.email,
          cpf: client.cpf,
          phone: client.phone,
        });

        if (!customer.id) {
          return reply.code(500).send({
            error: "Erro ao criar cliente no Asaas",
          });
        }

        asaasCustomerId = customer.id;

        // Salva o ID do Asaas no usuário pra não criar de novo
        await prisma.user.update({
          where: { id: client.id },
          data: { asaasWalletId: customer.id },
        });
      }

      // Cria a cobrança PIX
      const title =
        booking.service?.title || booking.tool?.title || "Serviço Fixsi";

      const charge = await createPixCharge({
        customerId: asaasCustomerId,
        amount: Number(booking.proposal.amount),
        description: `Fixsi - ${title}`,
        externalReference: booking.id,
      });

      if (!charge.id) {
        return reply.code(500).send({
          error: "Erro ao criar cobrança no Asaas",
          details: charge,
        });
      }

      // Busca o QR Code PIX
      const qrCode = await getPixQrCode(charge.id);

      // Calcula taxa da plataforma (10%) e valor do profissional (90%)
      const amount = Number(booking.proposal.amount);
      const platformFee = Math.round(amount * 0.1 * 100) / 100;
      const providerAmount = Math.round(amount * 0.9 * 100) / 100;

      // Salva o pagamento no banco
      const payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.proposal.amount,
          asaasChargeId: charge.id,
          pixQrCode: qrCode.encodedImage,
          pixKey: qrCode.payload,
          platformFee,
          providerAmount,
          status: "PENDING",
        },
      });

      return reply.code(201).send({
        payment: {
          id: payment.id,
          amount: payment.amount,
          pixKey: payment.pixKey,
          pixQrCode: payment.pixQrCode,
          status: payment.status,
        },
      });
    }
  );

  // Webhook do Asaas — chamado quando o PIX é pago
  app.post("/webhook", async (request, reply) => {
    // Valida o token do webhook
    const token = request.headers["asaas-access-token"] as string;

    if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
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
          error: "O serviço precisa estar concluído antes de liberar o pagamento",
        });
      }

      // Verifica se ambos avaliaram
      const reviews = payment.booking.reviews;
      const clientReview = reviews.find(
        (r) => r.authorId === payment.booking.clientId
      );
      const providerId =
        payment.booking.service?.userId || payment.booking.tool?.userId;
      const providerReview = reviews.find((r) => r.authorId === providerId);

      if (!clientReview || !providerReview) {
        return reply.code(400).send({
          error: "Ambas as partes precisam avaliar antes de liberar o pagamento",
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
    }
  );
}