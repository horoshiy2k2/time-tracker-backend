-- CreateTable
CREATE TABLE "CurrentSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT,
    "startTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CurrentSession_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
