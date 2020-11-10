const { readFileSync, writeFileSync } = require("fs");
const { resolve } = require("path");

const Handlebars = require("handlebars");
const prettier = require("prettier");
const sortKeys = require("sort-keys");

const ENDPOINTS = require("./generated/endpoints.json");
const ENDPOINTS_PATH = resolve(
  process.cwd(),
  "src",
  "generated",
  "Endpoints.ts"
);
const ENDPOINTS_TEMPLATE_PATH = resolve(
  process.cwd(),
  "scripts",
  "update-endpoints",
  "templates",
  "endpoints.ts.template"
);

const template = Handlebars.compile(
  readFileSync(ENDPOINTS_TEMPLATE_PATH, "utf8")
);

const endpointsByRoute = {};

run();

async function run() {
  for (const endpoint of ENDPOINTS) {
    if (endpoint.renamed) continue;

    const route = `${endpoint.method} ${endpoint.url}`;

    endpointsByRoute[route] = {
      method: endpoint.method.toLowerCase(),
      url: toOpenApiUrl(endpoint),
      requiredPreview: (endpoint.previews[0] || {}).name,
      documentationUrl: endpoint.documentationUrl,
    };

    // handle deprecated URL parameters
    for (const parameter of endpoint.parameters) {
      if (!parameter.deprecated || parameter.in !== "PATH") continue;
      const { alias, name } = parameter;
      const deprecatedRoute = route.replace(
        new RegExp(`\\{${alias}\\}`),
        `{${name}}`
      );

      endpointsByRoute[deprecatedRoute] = Object.assign(
        {},
        endpointsByRoute[route],
        {
          deprecated: `"${name}" is now "${alias}"`,
        }
      );
    }
  }

  const result = template({
    endpointsByRoute: sortKeys(endpointsByRoute, { deep: true }),
  });

  writeFileSync(
    ENDPOINTS_PATH,
    prettier.format(result, { parser: "typescript" })
  );
  console.log(`${ENDPOINTS_PATH} updated.`);
}

function toOpenApiUrl(endpoint) {
  return (
    endpoint.url
      // stecial case for "Upload a release asset": remove ":origin" prefix
      .replace(/^\{origin\}/, "")
      // remove query parameters
      .replace(/\{?\?.*$/, "")
  );
}
