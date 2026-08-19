import { PRD_SECTIONS } from "../lib/constants";

console.log(PRD_SECTIONS.map((section) => `## ${section}`).join("\n\n"));
