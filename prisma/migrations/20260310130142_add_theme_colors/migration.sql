-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "progressColor" TEXT NOT NULL DEFAULT '#646cff',
    "textColor" TEXT NOT NULL DEFAULT '#333333',
    "buttonColor" TEXT NOT NULL DEFAULT '#646cff',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("coins", "createdAt", "id") SELECT "coins", "createdAt", "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
