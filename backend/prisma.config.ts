import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "src/models/prisma/schema.prisma",
  datasource: {
    // @ts-ignore
    url: process.env.DATABASE_URL || "file:./database/dev.db",
  },
});
