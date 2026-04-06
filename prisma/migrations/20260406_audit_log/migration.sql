CREATE TABLE "AuditLog" (
  "id"         TEXT NOT NULL,
  "userEmail"  TEXT NOT NULL,
  "action"     TEXT NOT NULL,
  "entity"     TEXT NOT NULL,
  "entityId"   TEXT,
  "entityName" TEXT,
  "changes"    TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_entity_idx"    ON "AuditLog"("entity");
CREATE INDEX "AuditLog_userEmail_idx" ON "AuditLog"("userEmail");
