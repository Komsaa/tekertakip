CREATE TABLE "PanelUser" (
  "id"           TEXT NOT NULL,
  "username"     TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "role"         TEXT NOT NULL DEFAULT 'admin',
  "active"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PanelUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PanelUser_username_key" ON "PanelUser"("username");
