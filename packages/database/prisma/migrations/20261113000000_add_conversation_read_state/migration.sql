-- Estado de leitura por participante, usado pelo aviso de mensagens novas.
CREATE TABLE "ConversationRead" (
    "id" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ConversationRead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConversationRead_conversationId_userId_key"
ON "ConversationRead"("conversationId", "userId");

CREATE INDEX "ConversationRead_userId_lastReadAt_idx"
ON "ConversationRead"("userId", "lastReadAt");

ALTER TABLE "ConversationRead"
ADD CONSTRAINT "ConversationRead_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConversationRead"
ADD CONSTRAINT "ConversationRead_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
