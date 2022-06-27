// This code is not executed, only statically analyzed using `tsc --noEmit`
import { EndpointInterface, Endpoints } from "./src";

const endpoint = {} as EndpointInterface;
function assertString(type: string) {}
function assertNullableString(type: string | null | undefined) {}
function assertArray(type: unknown[]) {}

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
const test2 = {} as Endpoints["GET /scim/v2/organizations/{org}/Users"]["response"];
assertNullableString(test2.data.Resources[0].name.givenName);

const test3 = {} as Endpoints["POST /user/repos"]["parameters"];
assertString(test3.name);
