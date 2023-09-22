import { writeFileSync, readFileSync } from "fs"

if (!process.env.VERSION) {
  throw new Error(`VERSION environment variable must be set`);
}

const parentDir = new URL("../..", import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("package.json", parentDir), "utf8"));

if (!pkg.octokit) {
  pkg.octokit = {};
}

pkg.octokit["openapi-version"] = process.env.VERSION.replace(/^v/, "");

writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
