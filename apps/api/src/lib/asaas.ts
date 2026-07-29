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

interface AsaasErrorDetail {
  code?: string;
  description?: string;
}

interface AsaasErrorPayload {
  errors?: AsaasErrorDetail[];
}

export class AsaasApiError extends Error {
  constructor(
    public readonly providerStatus: number,
    public readonly providerErrors: AsaasErrorDetail[],
  ) {
    super(`Asaas respondeu com status ${providerStatus}`);
    this.name = "AsaasApiError";
  }
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
    signal: init?.signal ?? AbortSignal.timeout(15_000),
    headers: {
      access_token: environment.ASAAS_API_KEY,
      accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": `Serveo/1.0 (Node.js; ${environment.ASAAS_ENV})`,
      ...init?.headers,
    },
  });

  const rawPayload = await response.text();
  let payload: T | AsaasErrorPayload = {};
  if (rawPayload) {
    try {
      payload = JSON.parse(rawPayload) as T | AsaasErrorPayload;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const errorPayload = payload as AsaasErrorPayload;
    throw new AsaasApiError(response.status, errorPayload.errors ?? []);
  }

  return payload as T;
}

export async function createAsaasCustomer(user: {
  id: string;
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
      cpfCnpj: user.cpf.replace(/\D/g, ""),
      mobilePhone: user.phone.replace(/\D/g, ""),
      externalReference: user.id,
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

export function asaasPublicErrorMessage(error: unknown) {
  if (!(error instanceof AsaasApiError)) {
    return "O serviço de pagamento não respondeu. Tente novamente em alguns instantes.";
  }

  if (error.providerStatus === 400) {
    const description = error.providerErrors
      .map((item) => item.description?.trim())
      .find(Boolean);
    return description
      ? `Não foi possível gerar o PIX. ${description}`
      : "Os dados da cobrança foram recusados pelo Asaas. Confira seu CPF e telefone.";
  }

  if (error.providerStatus === 401 || error.providerStatus === 403) {
    return "O pagamento está temporariamente indisponível por uma falha de configuração.";
  }

  if (error.providerStatus === 404) {
    return "O cadastro de pagamento não foi localizado. Tente gerar o PIX novamente.";
  }

  if (error.providerStatus === 429) {
    return "O serviço de pagamento está ocupado. Aguarde um momento e tente novamente.";
  }

  return "O serviço de pagamento está temporariamente indisponível. Tente novamente mais tarde.";
}

export async function releasePayment(paymentId: string) {
  return { success: true, paymentId };
}
