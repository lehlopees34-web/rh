import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(scriptDir, "..");
const schemaDir = resolve(apiRoot, "prisma");
const envPath = resolve(apiRoot, ".env");
const envExamplePath = resolve(apiRoot, ".env.example");

if (!existsSync(envPath) && existsSync(envExamplePath)) {
  copyFileSync(envExamplePath, envPath);
  console.log("Arquivo .env criado a partir de .env.example");
}

const envSource = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const databaseUrl =
  process.env.DATABASE_URL ??
  envSource
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith("DATABASE_URL="))
    ?.replace(/^DATABASE_URL=/, "")
    .replace(/^"|"$/g, "");

if (!databaseUrl || !databaseUrl.startsWith("file:")) {
  process.exit(0);
}

const sqlitePath = databaseUrl.slice("file:".length).split("?")[0].split("#")[0];

if (!sqlitePath || sqlitePath === ":memory:") {
  process.exit(0);
}

const resolvedDatabasePath = isAbsolute(sqlitePath)
  ? sqlitePath
  : resolve(schemaDir, sqlitePath);

mkdirSync(dirname(resolvedDatabasePath), { recursive: true });
