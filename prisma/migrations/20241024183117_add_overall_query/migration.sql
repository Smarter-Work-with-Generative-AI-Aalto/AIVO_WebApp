-- AlterTable
ALTER TABLE "AIActivityLog" ADD COLUMN     "overallQuery" TEXT NOT NULL DEFAULT 'Create a summary based on the following findings:';

-- AlterTable
ALTER TABLE "AIRequestQueue" ADD COLUMN     "overallQuery" TEXT NOT NULL DEFAULT 'Create a summary based on the following findings:';
