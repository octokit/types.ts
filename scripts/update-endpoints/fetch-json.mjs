import { writeFileSync } from "fs"
import { resolve } from "path"
import { fileURLToPath } from "url"

import graphql from "github-openapi-graphql-query"
import { format } from "prettier"

if (!process.env.VERSION) {
  throw new Error(`VERSION environment variable must be set`);
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const version = process.env.VERSION.replace(/^v/, "");

const QUERY = `
  query ($version: String!, $ignoreChangesBefore: String!) {
    endpoints(version: $version, ignoreChangesBefore: $ignoreChangesBefore) {
      method
      url
      documentationUrl
      parameters {
        alias
        deprecated
        in
        name
      }
      renamed {
        note
      }
    }
  }`;

main();

async function main() {
  const {
    data: { endpoints },
  } = await graphql(QUERY, {
    version,
    ignoreChangesBefore: "2020-06-10",
  });

  writeFileSync(
    resolve(__dirname, "generated", "endpoints.json"),
    await format(JSON.stringify(endpoints), {
      parser: "json",
    }),
  );
}
