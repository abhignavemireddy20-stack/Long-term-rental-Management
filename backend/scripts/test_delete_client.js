import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const client = await prisma.client.findFirst({
    where: { clientName: "Automated Test Client" }
  });

  if (!client) {
    console.log("No test client found.");
    return;
  }

  console.log(`Found client ${client.clientName}. Attempting permanent delete...`);

  const deleted = await prisma.client.delete({
    where: { id: client.id }
  });
  console.log("Deleted successfully:", deleted.clientName);

  // Double check that it's gone
  const check = await prisma.client.findUnique({
    where: { id: client.id }
  });
  console.log("Confirm deleted (should be null):", check);
}

main().catch(console.error).finally(() => prisma.$disconnect());
