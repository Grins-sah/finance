-- CreateTable
CREATE TABLE "Data" (
    "id" SERIAL NOT NULL,
    "balance" TEXT NOT NULL,
    "monthlyIncome" TEXT NOT NULL,
    "monthlyExpenses" TEXT NOT NULL,
    "AdminId" TEXT NOT NULL,

    CONSTRAINT "Data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Data_AdminId_key" ON "Data"("AdminId");

-- AddForeignKey
ALTER TABLE "Data" ADD CONSTRAINT "Data_AdminId_fkey" FOREIGN KEY ("AdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
