-- CreateTable
CREATE TABLE "oauth_providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expiry" DATETIME,
    "scope" TEXT,
    "provider_data" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "oauth_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" DATETIME,
    "google_id" TEXT,
    "apple_id" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'email',
    "provider_verified" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "language" TEXT NOT NULL DEFAULT 'en',
    "last_login_at" DATETIME,
    "password_changed_at" DATETIME,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);
INSERT INTO "new_users" ("avatar_url", "created_at", "deleted_at", "email", "email_verified_at", "first_name", "id", "is_email_verified", "language", "last_login_at", "last_name", "password_changed_at", "password_hash", "role", "timezone", "two_factor_enabled", "two_factor_secret", "updated_at") SELECT "avatar_url", "created_at", "deleted_at", "email", "email_verified_at", "first_name", "id", "is_email_verified", "language", "last_login_at", "last_name", "password_changed_at", "password_hash", "role", "timezone", "two_factor_enabled", "two_factor_secret", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
CREATE UNIQUE INDEX "users_apple_id_key" ON "users"("apple_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "oauth_providers_provider_provider_id_key" ON "oauth_providers"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_providers_provider_email_key" ON "oauth_providers"("provider", "email");
