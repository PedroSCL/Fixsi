import { Prisma } from "@fixsi/database";

// A exclusão é atômica: se qualquer relação impedir a remoção, nada é apagado.
// Pedidos e conversas envolvem duas pessoas, por isso todas as dependências
// precisam sair antes do cadastro e dos anúncios.
export async function deleteAccountData(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const bookings = await tx.booking.findMany({
    where: {
      OR: [
        { clientId: userId },
        { providerId: userId },
        { service: { userId } },
        { tool: { userId } },
      ],
    },
    select: { id: true },
  });
  const bookingIds = bookings.map((booking) => booking.id);

  await tx.review.deleteMany({
    where: {
      OR: [
        { bookingId: { in: bookingIds } },
        { authorId: userId },
        { targetId: userId },
      ],
    },
  });
  await tx.message.deleteMany({
    where: {
      OR: [
        { conversation: { bookingId: { in: bookingIds } } },
        { senderId: userId },
      ],
    },
  });
  await tx.proposal.deleteMany({
    where: {
      OR: [
        { conversation: { bookingId: { in: bookingIds } } },
        { bookingId: { in: bookingIds } },
        { senderId: userId },
      ],
    },
  });
  await tx.conversation.deleteMany({
    where: { bookingId: { in: bookingIds } },
  });
  await tx.report.deleteMany({
    where: {
      OR: [
        { reporterId: userId },
        { service: { userId } },
        { tool: { userId } },
      ],
    },
  });
  await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
  await tx.service.deleteMany({ where: { userId } });
  await tx.tool.deleteMany({ where: { userId } });
  await tx.identityVerification.deleteMany({ where: { userId } });
  await tx.professionalAvailability.deleteMany({ where: { userId } });
  await tx.availabilityException.deleteMany({ where: { userId } });
  await tx.userRole.deleteMany({ where: { userId } });
  await tx.session.deleteMany({ where: { userId } });
  await tx.user.delete({ where: { id: userId } });
}
