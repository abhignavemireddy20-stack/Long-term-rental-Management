import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Test deleting the user "000" (ab@gmail.com)
  const targetId = "01722b57-195f-46c5-9942-43fa3aeed64d";
  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user) {
    console.log("User not found in DB.");
    return;
  }
  const deleted = await prisma.user.delete({
    where: { id: targetId }
  });
  console.log("Deleted successfully:", deleted);
}

main()
  .catch(e => console.error("Error deleting:", e))
  .finally(() => prisma.$disconnect());
