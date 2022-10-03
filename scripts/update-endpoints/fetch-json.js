const { writeFileSync } = require("fs");
const path = require("path");

const graphql = require("github-openapi-graphql-query");
const prettier = require("prettier");

if (!process.env.VERSION) {
  throw new Error(`VERSION environment variable must be set`);
}

const version = process.env.VERSION.replace(/^v/, "");

const QUERY = `
  query ($version: String!, $ignoreChangesBefore: String!) {
    endpoints(version: $version, ignoreChangesBefore: $ignoreChangesBefore, filter: { isGithubCloudOnly: false }) {
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

// In order to see operations which are only available in GitHub Enterprise Cloud
// (GHEC), `github-openapi-graphql-query` now looks at the GHEC-specific OpenAPI
// specifications. At the moment, the documentation URLs, therefore, are not
// normalised. This removes the references to GHEC.
const removeEnterpriseCloudFromDocumentationUrl = (endpoint) => ({
  ...endpoint,
  documentationUrl: endpoint.documentationUrl.replace(
    "/enterprise-cloud@latest/",
    ""
  ),
});

async function main() {
  const {
    data: { endpoints },
  } = await graphql(QUERY, {
    version,
    ignoreChangesBefore: "2020-06-10",
  });

  writeFileSync(
    path.resolve(__dirname, "generated", "endpoints.json"),
    prettier.format(
      JSON.stringify(endpoints.map(removeEnterpriseCloudFromDocumentationUrl)),
      {
        parser: "json",
      }
    )
  );
}
