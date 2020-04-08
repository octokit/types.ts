import { EndpointInterface } from "./EndpointInterface";
import { EndpointOptions } from "./EndpointOptions";
import { OctokitResponse } from "./OctokitResponse";
import { RequestParameters } from "./RequestParameters";
import { Route } from "./Route";

import { Endpoints } from "./generated/Endpoints";

export interface RequestInterface {
  /**
   * Sends a request based on endpoint options
   *
   * @param {object} endpoint Must set `method` and `url`. Plus URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <T = any>(options: EndpointOptions): Promise<OctokitResponse<T>>;

  /**
   * Sends a request based on endpoint options
   *
   * @param {string} route Request method + URL. Example: `'GET /orgs/:org'`
   * @param {object} [parameters] URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <R extends Route>(
    route: keyof Endpoints | R,
    options?: R extends keyof Endpoints
      ? Endpoints[R][0] & RequestParameters
      : RequestParameters
  ): R extends keyof Endpoints
    ? Promise<OctokitResponse<Endpoints[R][2]>>
    : Promise<OctokitResponse<any>>;

  /**
   * Returns a new `endpoint` with updated route and parameters
   */
  defaults: (newDefaults: RequestParameters) => RequestInterface;

  /**
   * Octokit endpoint API, see {@link https://github.com/octokit/endpoint.js|@octokit/endpoint}
   */
  endpoint: EndpointInterface;
}