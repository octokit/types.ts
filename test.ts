// This code is not executed, only statically analyzed using `tsc --noEmit`
import {
  EndpointInterface,
  Endpoints,
  RequestInterface,
  RequestParameters,
  Route,
} from "./src/index.js";

const endpoint = {} as EndpointInterface;
function assertString(_: string) {}
function assertType<T>(_: T) {}
function assertNullableString(_: string | null | undefined) {}
function assertArray(_: unknown[]) {}
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

// Test: ExtractParameters should merge all parameter types (path, query, header, etc.)
const testParameterMerge = {} as Endpoints["GET /advisories"]["parameters"];

// Should have query parameters accessible directly (not as union)
if ("per_page" in testParameterMerge) {
  assertType<number | undefined>(testParameterMerge.per_page);
}
if ("ghsa_id" in testParameterMerge) {
  assertType<string | undefined>(testParameterMerge.ghsa_id);
}

// Test with path and query parameters combined
const testPathAndQuery = {} as Endpoints["GET /repos/{owner}/{repo}/issues"]["parameters"];

// Both path and query parameters should be accessible in the same object
assertString(testPathAndQuery.owner); // from path
assertString(testPathAndQuery.repo); // from path
// query parameters should also be present (though optional)
assertType<string | number | undefined>(testPathAndQuery.milestone);
assertType<"open" | "closed" | "all" | undefined>(testPathAndQuery.state);

// Test that we don't have a union type (this would fail with union)
function requiresAllParams(
  params: { owner: string; repo: string; milestone?: string }
): void {
  assertString(params.owner);
  assertString(params.repo);
  if (params.milestone) {
    assertString(params.milestone);
  }
}

requiresAllParams(testPathAndQuery); // Should work if it's an intersection, not a union