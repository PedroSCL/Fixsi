import { getEnvironment } from "../config/env";

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

export function getAsaasBaseUrl(environment: "sandbox" | "production") {
  return environment === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

async function asaasRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const environment = getEnvironment();

  if (!environment.ASAAS_API_KEY) {
    throw new Error(
      "Integração Asaas não configurada. Defina ASAAS_API_KEY para usar pagamentos.",
    );
  }

  const baseUrl = getAsaasBaseUrl(environment.ASAAS_ENV);

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      access_token: environment.ASAAS_API_KEY,
      "Content-Type": "application/json",
      "User-Agent": `Serveo/1.0 (Node.js; ${environment.ASAAS_ENV})`,
      ...init?.headers,
    },
  });

  const payload = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`Asaas respondeu com status ${response.status}`);
  }

  return payload;
}

export async function createAsaasCustomer(user: {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      cpfCnpj: user.cpf,
      mobilePhone: user.phone,
    }),
  });
}

export async function createPixCharge(data: {
  customerId: string;
  amount: number;
  description: string;
  externalReference: string;
}): Promise<AsaasCharge> {
  return asaasRequest<AsaasCharge>("/payments", {
    method: "POST",
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
}

export async function getPixQrCode(paymentId: string): Promise<AsaasQrCode> {
  return asaasRequest<AsaasQrCode>(`/payments/${paymentId}/pixQrCode`);
}

export async function releasePayment(paymentId: string) {
  return { success: true, paymentId };
}
