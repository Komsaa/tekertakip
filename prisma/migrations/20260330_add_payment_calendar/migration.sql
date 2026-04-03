-- CreateTable
CREATE TABLE "PaymentCalendar" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION,
    "category" TEXT NOT NULL DEFAULT 'diger',
    "person" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'bekliyor',
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    "specificMonth" INTEGER,
    "specificYear" INTEGER,
    "color" TEXT NOT NULL DEFAULT '#DC2626',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentCalendar_pkey" PRIMARY KEY ("id")
);
