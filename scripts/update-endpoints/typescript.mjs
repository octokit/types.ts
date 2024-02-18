import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import handlebars from "handlebars";
import { format } from "prettier";
import sortKeys from "sort-keys";

const ENDPOINTS = JSON.parse(
  readFileSync(new URL("generated/endpoints.json", import.meta.url), "utf8"),
);
const ENDPOINTS_PATH = resolve(
  process.cwd(),
  "src",
  "generated",
  "Endpoints.ts",
);
const ENDPOINTS_TEMPLATE_PATH = resolve(
  process.cwd(),
  "scripts",
  "update-endpoints",
  "templates",
  "endpoints.ts.template",
);

const template = handlebars.compile(
  readFileSync(ENDPOINTS_TEMPLATE_PATH, "utf8"),
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
      documentationUrl: endpoint.documentationUrl,
    };

    // handle deprecated URL parameters
    for (const parameter of endpoint.parameters) {
      if (!parameter.deprecated || parameter.in !== "PATH") continue;
      const { alias, name } = parameter;
      const deprecatedRoute = route.replace(
        new RegExp(`\\{${alias}\\}`),
        `{${name}}`,
      );

      endpointsByRoute[deprecatedRoute] = Object.assign(
        {},
        endpointsByRoute[route],
        {
          deprecated: `"${name}" is now "${alias}"`,
        },
      );
    }
  }

  const result = template({
    endpointsByRoute: sortKeys(endpointsByRoute, { deep: true }),
  });

  writeFileSync(ENDPOINTS_PATH, await format(result, { parser: "typescript" }));
  console.log(`${ENDPOINTS_PATH} updated.`);
}

function toOpenApiUrl(endpoint) {
  return (
    endpoint.url
      // special case for "Upload a release asset": remove ":origin" prefix
      .replace(/^\{origin\}/, "")
      // remove query parameters
      .replace(/\{?\?.*$/, "")
  );
}
