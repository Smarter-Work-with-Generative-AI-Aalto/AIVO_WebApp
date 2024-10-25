-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVector" (
    "id" TEXT NOT NULL,
    "documentId" TEXT,
    "embedding" JSONB,
    "content" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIModel" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "azureOpenAIApiDeploymentName" TEXT,
    "azureOpenAIApiVersion" TEXT,
    "azureOpenAIBasePath" TEXT,
    "azureOpenAIApiKey" TEXT,
    "openAIApiKey" TEXT,
    "googleAIApiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRequestQueue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "documentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userSearchQuery" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION DEFAULT 1.0,
    "sequentialQuery" BOOLEAN NOT NULL DEFAULT true,
    "enhancedSearch" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'in queue',
    "individualFindings" JSONB,
    "overallSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRequestQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "documentIds" TEXT[],
    "userSearchQuery" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION,
    "sequentialQuery" BOOLEAN NOT NULL,
    "enhancedSearch" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "individualFindings" JSONB NOT NULL,
    "overallSummary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_teamId_idx" ON "Document"("teamId");

-- CreateIndex
CREATE INDEX "DocumentVector_documentId_idx" ON "DocumentVector"("documentId");

-- CreateIndex
CREATE INDEX "AIModel_teamId_idx" ON "AIModel"("teamId");

-- CreateIndex
CREATE INDEX "AIRequestQueue_userId_idx" ON "AIRequestQueue"("userId");

-- CreateIndex
CREATE INDEX "AIRequestQueue_teamId_idx" ON "AIRequestQueue"("teamId");

-- CreateIndex
CREATE INDEX "AIActivityLog_userId_idx" ON "AIActivityLog"("userId");

-- CreateIndex
CREATE INDEX "AIActivityLog_teamId_idx" ON "AIActivityLog"("teamId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVector" ADD CONSTRAINT "DocumentVector_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIModel" ADD CONSTRAINT "AIModel_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRequestQueue" ADD CONSTRAINT "AIRequestQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRequestQueue" ADD CONSTRAINT "AIRequestQueue_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIActivityLog" ADD CONSTRAINT "AIActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIActivityLog" ADD CONSTRAINT "AIActivityLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
