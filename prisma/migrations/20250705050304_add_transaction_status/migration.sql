/*
  Warnings:

  - The values [ANNUALLY] on the enum `RecurringInterval` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "RecurringInterval_new" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
ALTER TABLE "transactions" ALTER COLUMN "recurringInterval" TYPE "RecurringInterval_new" USING ("recurringInterval"::text::"RecurringInterval_new");
ALTER TYPE "RecurringInterval" RENAME TO "RecurringInterval_old";
ALTER TYPE "RecurringInterval_new" RENAME TO "RecurringInterval";
DROP TYPE "RecurringInterval_old";
COMMIT;

-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "lastAlertSent" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED';
