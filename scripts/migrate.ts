import { execSync } from "node:child_process";

execSync("prisma db push --schema database/schema.prisma", { stdio: "inherit" });
