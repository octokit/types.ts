const { readFileSync, writeFileSync } = require("fs");
const { resolve } = require("path");

const Handlebars = require("handlebars");
const set = require("lodash.set");
const { pascalCase } = require("pascal-case");
const prettier = require("prettier");
const { stringToJsdocComment } = require("string-to-jsdoc-comment");
const sortKeys = require("sort-keys");
const TypeWriter = require("@gimenete/type-writer");

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

Handlebars.registerHelper("name", function (parameter) {
  let name = parameter.key;

  if (/[.\[]/.test(name)) {
    name = `"${name}"`;
  }

  if (parameter.required) {
    return name;
  }

  return `${name}?`;
});

Handlebars.registerHelper("type", function (parameter) {
  const type = typeMap[parameter.type] || parameter.type;

  if (parameter.allowNull) {
    return `${type} | null`;
  }

  return type;
});

Handlebars.registerHelper("headersType", function (headers) {
  const result = JSON.stringify(headers);

  return `{ headers: ${result.replace(/\bnull\b/g, "string")}}`;
});

const template = Handlebars.compile(
  readFileSync(ENDPOINTS_TEMPLATE_PATH, "utf8")
);

const endpointsByRoute = {};

const typeMap = {
  integer: "number",
  "integer[]": "number[]",
};

for (const endpoint of ENDPOINTS) {
  if (endpoint.renamed) continue;

  const url = endpointToNormalizedUrl(endpoint);
  const route = `${endpoint.method} ${url}`;

  endpointsByRoute[route] = {
    documentationUrl: endpoint.documentationUrl,
    optionsTypeName: pascalCase(`${endpoint.scope} ${endpoint.id} Endpoint`),
    requestOptionsTypeName: pascalCase(
      `${endpoint.scope} ${endpoint.id} RequestOptions`
    ),
    responseTypeName: endpointToResponseTypeName(endpoint),
  };
}

const options = [];
const childParams = {};

for (const endpoint of ENDPOINTS) {
  if (endpoint.renamed) continue;

  const typeWriter = new TypeWriter();
  const { method, parameters } = endpoint;
  const url = endpointToNormalizedUrl(endpoint);

  const optionsTypeName = pascalCase(
    `${endpoint.scope} ${endpoint.id} Endpoint`
  );
  const requestOptionsTypeName = pascalCase(
    `${endpoint.scope} ${endpoint.id} RequestOptions`
  );

  const responses =
    endpoint.responses.length && endpoint.responses[0].examples
      ? endpoint.responses[0].examples.map((example) =>
          JSON.parse(example.data)
        )
      : undefined;
  if (responses) {
    typeWriter.add(responses, {
      rootTypeName: endpointToResponseTypeName(endpoint),
    });

    typeWriter.generate("typescript");
  }

  const headers = endpoint.headers.reduce((result, header) => {
    // accept header is set via mediatype
    if (header.name === "accept") {
      return result;
    }

    // content-length is set by fetch
    if (header.name === "content-length") {
      return result;
    }

    // // ignore headers with null values. THese can be required headers that must be set by the user,
    // // such as `headers['content-type']` for `octokit.repos.uploadReleaseAsset()`
    // if (header.value === null) {
    //   return result;
    // }

    if (!result) {
      result = {};
    }

    result[header.name] = header.value;
    return result;
  }, undefined);

  const extraParameters = [];
  // baseUrl must be set for "Upload a release asset"
  if (optionsTypeName === "ReposUploadReleaseAssetEndpoint") {
    extraParameters.push({
      name: "baseUrl",
      type: "string",
      description:
        "For https://api.github.com, set `baseUrl` to `https://uploads.github.com`. For GitHub Enterprise Server, set it to `<your hostname>/api/uploads`",
      required: true,
    });
  }

  options.push({
    requiredPreview: endpoint.previews.length
      ? endpoint.previews[0].name
      : null,
    headers,
    parameters: {
      name: optionsTypeName,
      parameters: parameters
        .concat(extraParameters)
        .map(parameterize)
        // handle "object" & "object[]" types
        .map((parameter) => {
          if (parameter.deprecated) {
            return;
          }

          const namespacedParamsName = pascalCase(
            `${endpoint.scope}.${endpoint.id}.Params`
          );

          if (parameter.type === "object" || parameter.type === "object[]") {
            const childParamsName = pascalCase(
              `${namespacedParamsName}.${parameter.key}`
            );

            parameter.type = parameter.type.replace("object", childParamsName);

            if (!childParams[childParamsName]) {
              childParams[childParamsName] = {};
            }
          }

          if (!/\./.test(parameter.key)) {
            return parameter;
          }

          const childKey = parameter.key.split(".").pop();
          const parentKey = parameter.key.replace(/\.[^.]+$/, "");

          parameter.key = childKey;

          const childParamsName = pascalCase(
            `${namespacedParamsName}.${parentKey}`
          );
          set(childParams, `${childParamsName}.${childKey}`, parameter);
        })
        .filter(Boolean),
    },
    request: {
      name: requestOptionsTypeName,
      method,
      url,
    },
    response: responses ? typeWriter.generate("typescript") : "",
  });

  process.stdout.write(".");
}

console.log("\ndone.");

const result = template({
  endpointsByRoute: sortKeys(endpointsByRoute, { deep: true }),
  options,
  childParams: Object.keys(childParams).map((key) => {
    return {
      paramTypeName: key,
      params: Object.values(childParams[key]),
    };
  }),
});

writeFileSync(
  ENDPOINTS_PATH,
  prettier.format(result, { parser: "typescript" })
);
console.log(`${ENDPOINTS_PATH} updated.`);

function parameterize(parameter) {
  const key = parameter.name;
  const type = typeMap[parameter.type] || parameter.type;
  const enums = parameter.enum
    ? parameter.enum.map(JSON.stringify).join("|")
    : null;

  return {
    name: pascalCase(key),
    key: key,
    required: parameter.required,
    type: enums || type,
    alias: parameter.alias,
    deprecated: parameter.deprecated,
    allowNull: parameter.allowNull,
    jsdoc: stringToJsdocComment(parameter.description),
  };
}

function endpointToResponseTypeName(endpoint) {
  const hasResponses =
    endpoint.responses.length && endpoint.responses[0].examples;

  if (hasResponses) {
    return pascalCase(`${endpoint.scope} ${endpoint.id} ResponseData`);
  }

  return "any";
}

function endpointToNormalizedUrl(endpoint) {
  return (
    endpoint.url
      // replace {param} with :param
      .replace(/\{([^?][^}]+)}/g, ":$1")
      // stecial case for "Upload a release asset": remove ":origin" prefix
      .replace(/^:origin/, "")
  );
}
