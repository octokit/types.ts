// This code is not executed, only statically analyzed using `tsc --noEmit`
import { EndpointInterface } from "./src";

const endpoint = null as EndpointInterface;
function assertString(type: string) {}

const createIssueOptions = {
  owner: "octocat",
  repo: "hello-world",
  title: "My new issue!",
  headers: {
    "x-foo": "bar",
  },
};
const result = endpoint("POST /repos/:owner/:repo/issues", createIssueOptions);
const resultMerge = endpoint.merge(
  "POST /repos/:owner/:repo/issues",
  createIssueOptions
);
const resultMerge2 = endpoint.merge(createIssueOptions);

assertString(result.headers["x-foo"]);
assertString(resultMerge.title);
assertString(resultMerge.headers["x-foo"]);
assertString(resultMerge2.url);
