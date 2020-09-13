const { readFileSync, writeFileSync } = require("fs");
const { resolve } = require("path");

const Handlebars = require("handlebars");
const set = require("lodash.set");
const { pascalCase } = require("pascal-case");
const prettier = require("prettier");
const { stringToJsdocComment } = require("string-to-jsdoc-comment");
const sortKeys = require("sort-keys");
const { compile } = require("json-schema-to-typescript");

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

  if (/[.\[]/.test(name) && name !== "[key: string]") {
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

run();

async function run() {
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
      jsdoc: stringToJsdocComment(`@see ${endpoint.documentationUrl}`),
      scope: endpoint.scope,
      id: endpoint.id,
      method: endpoint.method,
      url,
      previews: endpoint.previews,
      headers: endpoint.headers,
      responses: endpoint.responses,
      parameters: endpoint.parameters.filter(isntDeprecatedPathParameter),
    };

    for (const deprecatedPathparameter of endpoint.parameters) {
      if (!deprecatedPathparameter.alias) continue;
      if (deprecatedPathparameter.in !== "PATH") continue;

      const deprecatedRoute = route.replace(
        new RegExp(`:${deprecatedPathparameter.alias}\\b`),
        `:${deprecatedPathparameter.name}`
      );

      endpointsByRoute[deprecatedRoute] = Object.assign(
        {},
        endpointsByRoute[route],
        {
          optionsTypeName: pascalCase(
            `${endpoint.scope} ${endpoint.id} Deprecated ${deprecatedPathparameter.name} Endpoint`
          ),
          parameters: endpoint.parameters.filter((parameter) => {
            return parameter.name !== deprecatedPathparameter.alias;
          }),
          jsdoc: stringToJsdocComment(
            [
              `@see ${endpoint.documentationUrl}`,
              `@deprecated "${deprecatedPathparameter.name}" is deprecated, use "${deprecatedPathparameter.alias}" instead`,
            ].join("\n")
          ),
          hasDeprecatedPath: true,
        }
      );
    }
  }

  const options = [];
  const childParams = {};

  for (const endpoint of Object.values(endpointsByRoute)) {
    const {
      method,
      parameters,
      url,
      optionsTypeName,
      requestOptionsTypeName,
    } = endpoint;

    const responsesSchemas =
      endpoint.responses.length &&
      endpoint.responses.map((response, i) => {
        // first response is default response, so we just want *ResponseData. For the other we want e.g. *Response400Data
        const code = i === 0 ? "" : " " + response.code;

        return {
          schema: JSON.parse(response.schema),
          name: pascalCase(
            `${endpoint.scope} ${endpoint.id} Response${code} Data`
          ).replace(/_/, ""),
        };
      });

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

    // workarounds for "Upload a release asset"
    if (optionsTypeName === "ReposUploadReleaseAssetEndpoint") {
      // baseUrl must be set for "Upload a release asset"
      extraParameters.push({
        name: "baseUrl",
        type: "string",
        description:
          "For https://api.github.com, set `baseUrl` to `https://uploads.github.com`. For GitHub Enterprise Server, set it to `<your hostname>/api/uploads`",
        required: true,
      });

      // data can be either a string or Buffer. Currently the OpenAPI types only specify a type of string.
      const data = parameters.find((parameter) => parameter.name === "data");
      data.type = "string | Buffer";
    }

    const option = {
      parameters: {
        name: optionsTypeName,
        parameters: parameters
          .concat(extraParameters)
          .map(parameterize)
          // handle "object" & "object[]" types
          .map((parameter) => {
            const namespacedParamsName = pascalCase(
              `${endpoint.scope}.${endpoint.id}.Params`
            );

            if (parameter.type === "object" || parameter.type === "object[]") {
              const childParamsName = pascalCase(
                `${namespacedParamsName}.${parameter.key}`
              );

              parameter.type = parameter.type.replace(
                "object",
                childParamsName
              );

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
    };
    if (!endpoint.hasDeprecatedPath) {
      option.requiredPreview = endpoint.previews.length
        ? endpoint.previews[0].name
        : null;
      option.headers = headers;
      option.request = `
        type ${requestOptionsTypeName} = {
          method: "${method}",
          url: "${url}",
          headers: RequestHeaders,
          request: RequestRequestOptions
        }
      `;
      option.response = await getResponseSchemasString(responsesSchemas);
    }
    options.push(option);

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
}

async function getResponseSchemasString(responsesSchemas) {
  if (!responsesSchemas) {
    return "";
  }

  const strings = await Promise.all(
    responsesSchemas.map(({ schema, name }) => {
      patchSchema(schema);
      return compile(schema, name, { bannerComment: false });
    })
  );

  return strings.join("\n\n");
}

function patchSchema(schema) {
  if (schema.items) {
    patchSchema(schema.items);
  }

  if (!schema.properties) return;

  // make all keys required, set additionalProperties to false
  schema.required = Object.keys(schema.properties);
  schema.additionalProperties = false;

  Object.values(schema.properties).forEach(patchSchema);
}

function parameterize(parameter) {
  let key = parameter.name;
  const type = typeMap[parameter.type] || parameter.type || "any";
  const enums = parameter.enum
    ? parameter.enum.map(JSON.stringify).join("|")
    : null;

  let description = parameter.description ? parameter.description : "";

  if (parameter.deprecated) {
    description += `\n @deprecated "${key}" is deprecated.`;
    if (parameter.alias) {
      description += ` Use "${parameter.alias}" instead`;
    }
  }

  if (/\*/.test(key)) {
    return {
      name: pascalCase(key.replace(/\*/, "Object")),
      key: key.replace(/\*/, "[key: string]"),
      required: true,
      type: enums || type,
      alias: parameter.alias,
      deprecated: parameter.deprecated,
      allowNull: parameter.allowNull,
      jsdoc: stringToJsdocComment(description),
    };
  }

  return {
    name: pascalCase(key),
    key: key,
    required: parameter.required,
    type: enums || type,
    alias: parameter.alias,
    deprecated: parameter.deprecated,
    allowNull: parameter.allowNull,
    jsdoc: stringToJsdocComment(description),
  };
}

function endpointToResponseTypeName(endpoint) {
  const hasResponses = endpoint.responses.length;

  if (hasResponses) {
    return endpoint.responses
      .map((response, i) => {
        // first response is default response, so we just want *ResponseData. For the other we want e.g. *Response400Data
        const code = i === 0 ? "" : response.code + " ";
        return pascalCase(
          `${endpoint.scope} ${endpoint.id} Response ${code}Data`
        ).replace(/_/, "");
      })
      .join(" | ");
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

function isntDeprecatedPathParameter(parameter) {
  if (!parameter.alias) return true;
  if (parameter.in !== "PATH") return true;

  return false;
}
