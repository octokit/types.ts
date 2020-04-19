// This code is not executed, only statically analyzed using `tsc --noEmit`
import { EndpointInterface, RequestMethod, RequestInterface } from "./src";

const endpoint = null as EndpointInterface;

const fooOptions = { foo: "bar" };
const bazOptions = { baz: "daz" };
const overrideOptions = { foo: "newbar" };
const routeOptions = { method: "GET", url: "/foo" };

const test = endpoint.defaults(fooOptions);
const test2 = test.defaults(bazOptions);
const test3 = test2.defaults(overrideOptions);
const test4 = test3.defaults(routeOptions);

function assertString(type: string) {}
function assertRequestMethod(type: RequestMethod) {}

assertString(test.DEFAULTS.foo);
assertString(test2.DEFAULTS.foo);
assertString(test2.DEFAULTS.baz);
assertString(test3.DEFAULTS.foo);
assertRequestMethod(test4.DEFAULTS.method);

const result4 = test4({ method: "PUT", url: "/funk", headers: { foo: "bar" } });
assertString(result4.headers.foo);
// "url" parameter is required
// endpoint({});
// "url" is optional if set on defaults
assertString(test4({}).url);

const test5 = test4.defaults({
  method: "PUT",
  url: "/funk",
  headers: { foo: "bar" },
});

assertRequestMethod(test5({}).method);
assertString(test5({}).url);
assertString(test5({}).headers.foo);

const createIssueOptions = {
  owner: "octocat",
  repo: "hello-world",
  title: "My new issue!",
  headers: {
    "x-foo": "bar",
  },
};
const result5 = test5("POST /repos/:owner/:repo/issues", createIssueOptions);
const result5merge = test5.merge(
  "POST /repos/:owner/:repo/issues",
  createIssueOptions
);
const result5merge2 = test5.merge(createIssueOptions);

assertString(result5.headers["x-foo"]);
assertString(result5merge.title);
assertString(result5merge.headers["x-foo"]);
assertString(result5merge2.url);

const staticParseResult = endpoint.parse({
  baseUrl: "https://api.github.com",
  method: "GET",
  url: "/funk",
  mediaType: {
    format: "",
    previews: [],
  },
  headers: {
    "user-agent": "MyApp/1.2.3",
    accept: "foo",
    "x-foo": "bar",
  },
});

assertString(staticParseResult.headers["x-foo"]);

const request = null as RequestInterface;

const rtest = request.defaults(fooOptions);
const rtest2 = rtest.defaults(bazOptions);
const rtest3 = rtest2.defaults(overrideOptions);
const rtest4 = rtest3.defaults(routeOptions);

assertString(rtest.endpoint.DEFAULTS.foo);
assertString(rtest2.endpoint.DEFAULTS.foo);
assertString(rtest2.endpoint.DEFAULTS.baz);
assertString(rtest3.endpoint.DEFAULTS.foo);
assertRequestMethod(rtest4.endpoint.DEFAULTS.method);
