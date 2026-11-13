function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    console.warn("Recuperação de senha solicitada sem BREVO_API_KEY configurada");
    return false;
  }

  const safeName = escapeHtml(name);
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          name: process.env.BREVO_SENDER_NAME || "Fixsi",
        },
        to: [{ email }],
        subject: "Redefina sua senha da Fixsi",
        htmlContent: `
          <main style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#17233B">
            <h1 style="color:#F47A00">Recuperação de senha</h1>
            <p>Olá, ${safeName}.</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta Fixsi.</p>
            <p style="margin:28px 0">
              <a href="${resetUrl}" style="background:#F47A00;color:#fff;padding:14px 20px;border-radius:8px;font-weight:700;text-decoration:none">Criar nova senha</a>
            </p>
            <p>Este link é válido por 1 hora e só pode ser usado uma vez.</p>
            <p>Se não foi você, ignore este e-mail. Sua senha atual continuará segura.</p>
          </main>`,
      }),
    });

    if (!response.ok) {
      console.error("Falha ao enviar e-mail de recuperação via Brevo", response.status);
      return false;
    }
  } catch (error) {
    console.error(
      "Falha ao enviar e-mail de recuperação via Brevo",
      error instanceof Error ? error.message : error,
    );
    return false;
  }

  return true;
}
