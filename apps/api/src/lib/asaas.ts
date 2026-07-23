const ASAAS_URL = "https://sandbox.asaas.com/api/v3";
const ASAAS_KEY = process.env.ASAAS_API_KEY!;

const headers = {
  "access_token": ASAAS_KEY,
  "Content-Type": "application/json",
};

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
}

interface AsaasCharge {
  id: string;
  value: number;
  status: string;
  billingType: string;
  invoiceUrl: string;
}

interface AsaasQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export async function createAsaasCustomer(user: {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}): Promise<AsaasCustomer> {
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
  return res.json() as Promise<AsaasCustomer>;
}

export async function createPixCharge(data: {
  customerId: string;
  amount: number;
  description: string;
  externalReference: string;
}): Promise<AsaasCharge> {
  const res = await fetch(`${ASAAS_URL}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer: data.customerId,
      billingType: "PIX",
      value: data.amount,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      description: data.description,
      externalReference: data.externalReference,
    }),
  });
  return res.json() as Promise<AsaasCharge>;
}

export async function getPixQrCode(paymentId: string): Promise<AsaasQrCode> {
  const res = await fetch(`${ASAAS_URL}/payments/${paymentId}/pixQrCode`, {
    headers,
  });
  return res.json() as Promise<AsaasQrCode>;
}

export async function releasePayment(paymentId: string) {
  return { success: true, paymentId };
}