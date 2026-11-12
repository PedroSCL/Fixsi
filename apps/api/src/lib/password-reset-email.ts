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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("Recuperação de senha solicitada sem RESEND_API_KEY configurada");
    return false;
  }

  const safeName = escapeHtml(name);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Fixsi <onboarding@resend.dev>",
      to: [email],
      subject: "Redefina sua senha da Fixsi",
      html: `
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
    console.error("Falha ao enviar e-mail de recuperação", response.status);
    return false;
  }

  return true;
}
