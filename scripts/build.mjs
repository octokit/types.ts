import { copyFile, readFile, writeFile, rm, mkdir } from "node:fs/promises";


async function main() {
  // Start with a clean slate
  await rm("pkg", { recursive: true, force: true });
  await mkdir("pkg");

  // Copy the README, LICENSE to the pkg folder
  await copyFile("LICENSE", "pkg/LICENSE");
  await copyFile("README.md", "pkg/README.md");

  // Handle the package.json
  let pkg = JSON.parse((await readFile("package.json", "utf8")).toString());
  // Remove unnecessary fields from the package.json
  delete pkg.scripts;
  delete pkg.prettier;
  delete pkg.release;
  delete pkg.jest;
  await writeFile(
    "pkg/package.json",
    JSON.stringify(
      {
        ...pkg,
        files: ["dist-types/**"],
        types: "dist-types/index.d.ts",
        sideEffects: false,
      },
      null,
      2
    )
  );
}
main();
