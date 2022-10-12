// This code is not executed, only statically analyzed using `tsc --noEmit`
import {
  EndpointInterface,
  Endpoints,
  RequestInterface,
  RequestParameters,
  Route,
} from "./src";

const endpoint = {} as EndpointInterface;
function assertString(type: string) {}
function assertNullableString(type: string | null | undefined) {}
function assertArray(type: unknown[]) {}
const assertPaginate = {} as {
  <R extends Route>(route: R): Promise<void>;
  <R extends RequestInterface>(request: R): Promise<void>;
};

const createIssueOptions = {
  owner: "octocat",
  repo: "hello-world",
  title: "My new issue!",
  headers: {
    "x-foo": "bar",
  },
};
const result = endpoint(
  "POST /repos/{owner}/{repo}/issues",
  createIssueOptions
);
const resultMerge = endpoint.merge(
  "POST /repos/{owner}/{repo}/issues",
  createIssueOptions
);
const resultMerge2 = endpoint.merge(createIssueOptions);

assertString(result.headers["x-foo"]);
assertString(resultMerge.title);
assertString(resultMerge.headers["x-foo"]);
assertNullableString(resultMerge2.url);

const test = {} as Endpoints["GET /repos/{owner}/{repo}/issues"]["response"];
assertArray(test.data);
assertString(test.data[0].assignees![0].avatar_url);

const test3 = {} as Endpoints["POST /user/repos"]["parameters"];
assertString(test3.name);

const checkRunsRoute =
  "GET /repos/{owner}/{repo}/commits/{ref}/check-runs" as const;

assertPaginate(checkRunsRoute);

const listForRef = {} as {
  (
    params?: RequestParameters &
      Omit<
        Endpoints["GET /repos/{owner}/{repo}/commits/{ref}/check-runs"]["parameters"],
        "baseUrl" | "headers" | "mediaType"
      >
  ): Promise<Endpoints[typeof checkRunsRoute]["response"]>;
  defaults: RequestInterface["defaults"];
  endpoint: EndpointInterface<{
    url: string;
  }>;
};

// octokit.paginate can take `request` method. ref: https://github.com/octokit/plugin-paginate-rest.js/blob/b3fb11e301f9658554e110aeebbd7cbb89b8aad4/README.md?plain=1#L117-L126
assertPaginate(listForRef);
