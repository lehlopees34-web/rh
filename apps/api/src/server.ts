import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(currentDir, "..");
const envCandidates = [resolve(apiRoot, ".env"), resolve(apiRoot, "..", "..", ".env")];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const app = createApp();
const port = Number(process.env.PORT ?? 3333);

app.listen(port, () => {
  console.log(`API de RH e DRE em http://localhost:${port}`);
});
