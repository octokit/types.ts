// This code is not executed, only statically analyzed using `tsc --noEmit`
import { EndpointInterface, Endpoints } from "./src";

const endpoint = null as EndpointInterface;
function assertString(type: string) {}
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
assertString(resultMerge2.url);

const test = {} as Endpoints["GET /repos/{owner}/{repo}/issues"]["response"];
assertArray(test.data);
assertString(test.data[0].assignees[0].avatar_url);
const test2 = {} as Endpoints["GET /scim/v2/organizations/{org}/Users"]["response"];
assertString(test2.data.Resources[0].name.givenName);
