import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.template.createMany({
    data: [
      {
        name: "SaaS MVP PRD",
        category: "SaaS",
        description: "A practical PRD template for subscription products.",
        content: "# SaaS MVP PRD\n\n## Executive Summary\n\n## Problem Statement\n\n## Functional Requirements\n\n## Acceptance Criteria"
      },
      {
        name: "Mobile App PRD",
        category: "Mobile",
        description: "A mobile-first PRD template with app store and offline considerations.",
        content: "# Mobile App PRD\n\n## Personas\n\n## Journeys\n\n## Screens\n\n## Release Plan"
      }
    ],
    skipDuplicates: true
  });
}

main().finally(async () => prisma.$disconnect());
