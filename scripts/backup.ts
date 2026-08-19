import { mkdirSync, copyFileSync, existsSync } from "node:fs";

mkdirSync("backups", { recursive: true });
if (existsSync("database/schema.prisma")) copyFileSync("database/schema.prisma", `backups/schema-${Date.now()}.prisma`);
