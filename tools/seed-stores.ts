import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding lojas e API keys...");

  const stores = [
    { code: "L01", name: "Loja Centro" },
    { code: "L02", name: "Loja Bairro" },
  ];

  for (const store of stores) {
    // Gera API key única para a loja
    const apiKey = randomBytes(16).toString("hex");

    const created = await prisma.store.upsert({
      where: { code: store.code },
      update: { name: store.name, api_key: apiKey },
      create: {
        code: store.code,
        name: store.name,
        api_key: apiKey,
      },
    });

    console.log(`Loja ${created.code} (${created.name}) → API KEY: ${created.api_key}`);
  }
}

main()
  .then(() => {
    console.log("Seed concluído.");
    prisma.$disconnect();
  })
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
