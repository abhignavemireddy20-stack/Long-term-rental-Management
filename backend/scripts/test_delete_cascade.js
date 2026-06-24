import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const targetId = "c8eebb12-abec-4075-94a3-641469304a31"; // Sarah Staff
  const user = await prisma.user.findUnique({ where: { id: targetId }, include: { auditLogs: true } });
  if (!user) {
    console.log("User not found.");
    return;
  }
  
  console.log(`Attempting to delete ${user.name} who has ${user.auditLogs.length} audit logs.`);
  
  // We will run this inside a transaction and throw an error at the end to roll it back, 
  // ensuring we don't actually delete Sarah Staff.
  await prisma.$transaction(async (tx) => {
    const deleted = await tx.user.delete({
      where: { id: targetId }
    });
    console.log("Deleted user inside transaction successfully:", deleted.name);
    
    // Check if audit logs were also deleted
    const logsCount = await tx.auditLog.count({
      where: { userId: targetId }
    });
    console.log("Remaining audit logs inside transaction:", logsCount);
    
    throw new Error("ROLLBACK_FOR_TESTING");
  });
}

main()
  .catch(e => {
    if (e.message === "ROLLBACK_FOR_TESTING") {
      console.log("Transaction rolled back successfully. No permanent changes made.");
    } else {
      console.error("Error during deletion:", e);
    }
  })
  .finally(() => prisma.$disconnect());
