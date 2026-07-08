import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.string().default("5000"),

  DATABASE_URL: z.string(),

  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),

  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),

  // Comma-separated list of allowed CORS origins.
  // Example: "https://your-app.vercel.app,https://chit-chat-frontend-gilt.vercel.app"
  CORS_ORIGIN: z.string().default("https://chit-chat-frontend-gilt.vercel.app,http://localhost:4000"),
});


const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  process.exit(1);
}

export const env = parsed.data;