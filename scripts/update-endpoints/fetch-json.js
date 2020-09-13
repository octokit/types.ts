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
      name
      scope(format: CAMELCASE)
      id(format: CAMELCASE)
      method
      url
      documentationUrl
      parameters {
        alias
        allowNull
        deprecated
        description
        enum
        in
        name
        type
        required
      }
      previews(required: true) {
        name
      }
      headers {
        name
        value
        required
      }
      responses {
        code
        description
        schema
      }
      renamed {
        note
      }
    }
  }`;

main();

async function main() {
  const { endpoints } = await graphql(QUERY, {
    url: "https://github-openapi-graphql-server.vercel.app/api/graphql",
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
