import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/models/prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL") || "file:./database/dev.db",
  },
});
