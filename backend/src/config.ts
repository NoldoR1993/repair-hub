import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  CORS_ORIGIN: z
    .string()
    .default(
      "http://localhost:3000,http://localhost:4173,http://localhost:5173,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:4173,http://127.0.0.1:5173,http://127.0.0.1:8080",
    ),
});

export const env = envSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
