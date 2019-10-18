# types.ts

> Shared TypeScript definitions for Octokit projects

[![@latest](https://img.shields.io/npm/v/@octokit/types.svg)](https://www.npmjs.com/package/@octokit/types)
[![Build Status](https://github.com/octokit/types.ts/workflows/Test/badge.svg)](https://github.com/octokit/types.ts/actions?workflow=Test)
[![Greenkeeper](https://badges.greenkeeper.io/octokit/types.ts.svg)](https://greenkeeper.io/)

## Usage

```js
import { Endpoint, OctokitResponse, RequestParameters, Route } from "@octokit/types"

interface myRequestDecorater {
  /**
   * Sends a request based on endpoint options
   *
   * @param {object} endpoint Must set `method` and `url`. Plus URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <T = any>(options: Endpoint): Promise<OctokitResponse<T>>;

  /**
   * Sends a request based on endpoint options
   *
   * @param {string} route Request method + URL. Example: `'GET /orgs/:org'`
   * @param {object} [parameters] URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <T = any>(route: Route, parameters?: RequestParameters): Promise<OctokitResponse<T>>;
}
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

[MIT](LICENSE)
