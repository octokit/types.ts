import { EndpointInterface } from "./EndpointInterface";
import { OctokitResponse } from "./OctokitResponse";
import { RequestParameters } from "./RequestParameters";
import { Route } from "./Route";

import { Endpoints } from "./generated/Endpoints";

export interface RequestInterface<D extends object = object> {
  /**
   * Sends a request based on endpoint options
   *
   * @param {object} endpoint Must set `method` and `url`. Plus URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <T = any, O extends RequestParameters = RequestParameters>(
    options: O & { method?: string } & ("url" extends keyof D
        ? { url?: string }
        : { url: string })
  ): Promise<OctokitResponse<T>>;

  /**
   * Sends a request based on endpoint options
   *
   * @param {string} route Request method + URL. Example: `'GET /orgs/{org}'`
   * @param {object} [parameters] URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <R extends keyof Endpoints>(
    route: R,
    options?: Endpoints[R]["parameters"] & RequestParameters
  ): Promise<Endpoints[R]["response"]>;

  /**
   * Sends a request based on endpoint options
   *
   * @param {string} route Request method + URL. Example: `'GET /orgs/{org}'`
   * @param {object} [parameters] URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  (route: Route, options?: RequestParameters): Promise<OctokitResponse<any>>;

  /**
   * Returns a new `request` with updated route and parameters
   */
  defaults: <O extends RequestParameters = RequestParameters>(
    newDefaults: O
  ) => RequestInterface<D & O>;

  /**
   * Octokit endpoint API, see {@link https://github.com/octokit/endpoint.js|@octokit/endpoint}
   */
  endpoint: EndpointInterface<D>;
}
