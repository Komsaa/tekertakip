import { prisma } from "./prisma";

export async function logAction(params: {
  userEmail: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: string;
  entityId?: string;
  entityName?: string;
  changes?: object;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userEmail: params.userEmail,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        entityName: params.entityName,
        changes: params.changes ? JSON.stringify(params.changes, null, 2) : null,
      },
    });
  } catch {
    // Log hatası ana işlemi engellemez
  }
}
