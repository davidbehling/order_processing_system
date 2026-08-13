CREATE UNIQUE INDEX user_unique_active
ON "User" ("email")
WHERE "deletedAt" IS NULL;