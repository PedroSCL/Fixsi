import { z } from "zod";

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z.string().trim().min(1, "DATABASE_URL é obrigatória"),
    FRONTEND_URL: z.string().url().default("http://localhost:3000"),
    JWT_SECRET: z.string().min(32).optional(),
  })
  .superRefine((values, context) => {
    if (values.NODE_ENV !== "production") return;

    if (!values.JWT_SECRET) {
      context.addIssue({
        code: "custom",
        path: ["JWT_SECRET"],
        message: "JWT_SECRET é obrigatória em produção",
      });
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(input: NodeJS.ProcessEnv): Environment {
  const result = environmentSchema.safeParse(input);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Configuração de ambiente inválida: ${details}`);
  }

  return result.data;
}

let cachedEnvironment: Environment | undefined;

export function getEnvironment() {
  cachedEnvironment ??= parseEnvironment(process.env);
  return cachedEnvironment;
}
