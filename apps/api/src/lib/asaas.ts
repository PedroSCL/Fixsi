const ASAAS_URL = "https://sandbox.asaas.com/api/v3";
const ASAAS_KEY = process.env.ASAAS_API_KEY!;

const headers = {
  "access_token": ASAAS_KEY,
  "Content-Type": "application/json",
};

// Cria um cliente no Asaas (necessário antes de criar cobrança)
export async function createAsaasCustomer(user: {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}) {
  const res = await fetch(`${ASAAS_URL}/customers`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      cpfCnpj: user.cpf,
      mobilePhone: user.phone,
    }),
  });
  return res.json();
}

// Cria cobrança PIX
export async function createPixCharge(data: {
  customerId: string;
  amount: number;
  description: string;
  externalReference: string; // ID do booking
}) {
  const res = await fetch(`${ASAAS_URL}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer: data.customerId,
      billingType: "PIX",
      value: data.amount,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // vence amanhã
      description: data.description,
      externalReference: data.externalReference,
    }),
  });
  return res.json();
}

// Busca o QR Code PIX de uma cobrança
export async function getPixQrCode(paymentId: string) {
  const res = await fetch(`${ASAAS_URL}/payments/${paymentId}/pixQrCode`, {
    headers,
  });
  return res.json();
}

// Libera pagamento (transfere pro profissional)
// No sandbox isso é simulado
export async function releasePayment(paymentId: string) {
  // No modelo do Fixsi, a liberação é feita via transferência
  // entre contas Asaas após confirmação do cliente
  // Por enquanto retorna true — implementação completa na fase de escrow
  return { success: true, paymentId };
}