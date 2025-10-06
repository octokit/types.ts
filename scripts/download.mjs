import { writeFileSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";

import { Octokit } from "@octokit/core";
import { paginateRest } from "@octokit/plugin-paginate-rest";
import gheVersions from "github-enterprise-server-versions";
const { getCurrentVersions } = gheVersions;

if (!process.env.OCTOKIT_OPENAPI_VERSION) {
  throw new Error("OCTOKIT_OPENAPI_VERSION is not set");
}

run(process.env.OCTOKIT_OPENAPI_VERSION.replace(/^v/, "")).then(
  () => console.log("done"),
  console.error,
);

const OctokitWithPlugins = Octokit.plugin(paginateRest);

const octokit = new OctokitWithPlugins({
  auth: process.env.GITHUB_TOKEN,
});

async function run(version) {
  await rm("cache", { recursive: true });
  await mkdir("cache");

  const {
    data: { id: releaseId },
  } = await octokit.request("GET /repos/{owner}/{repo}/releases/tags/{tag}", {
    owner: "octokit",
    repo: "openapi",
    tag: `v${version}`,
  });

  const releaseAssets = await octokit.paginate(
    "GET /repos/{owner}/{repo}/releases/{release_id}/assets",
    {
      owner: "octokit",
      repo: "openapi",
      release_id: releaseId,
    },
  );

  const currentGHESVersions = await getCurrentVersions();
  for (const asset of releaseAssets) {
    if (!/\.json$/.test(asset.name)) continue;
    if (/deref/.test(asset.name)) continue;
    if (/diff/.test(asset.name)) continue;

    if (/^ghes-/.test(asset.name)) {
      if (
        !currentGHESVersions.includes(
          asset.name.substr("ghes-".length).replace(/\.json$/, ""),
        )
      ) {
        continue;
      }
    }

    await download(asset.id, asset.name);
  }
}

async function download(assetId, fileName) {
  const localPath = `cache/${fileName}`;

  console.log(`Downloading ${fileName} (${assetId}) to ${localPath}`);

  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/releases/assets/{asset_id}",
    {
      owner: "octokit",
      repo: "openapi",
      asset_id: assetId,
      headers: {
        Accept: "application/octet-stream",
      },
    },
  );

  writeFileSync(localPath, Buffer.from(response.data));

  console.log(`Finished writing to ${localPath}`);
}
