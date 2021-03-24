const { writeFileSync } = require("fs");
const path = require("path");

const { graphql } = require("@octokit/graphql");
const prettier = require("prettier");

if (!process.env.VERSION) {
  throw new Error(`VERSION environment variable must be set`);
}

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
      previews(required: true) {
        name
      }
      renamed {
        note
      }
    }
  }`;

main();

async function main() {
  const { endpoints } = await graphql(QUERY, {
    baseUrl: "https://github-openapi-graphql-server.vercel.app/api",
    version,
    ignoreChangesBefore: "2020-06-10",
  });

  writeFileSync(
    path.resolve(__dirname, "generated", "endpoints.json"),
    prettier.format(JSON.stringify(endpoints), {
      parser: "json",
    })
  );
}
