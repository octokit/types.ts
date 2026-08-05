import type { EndpointInterface } from "./EndpointInterface.js";
import type { OctokitResponse } from "./OctokitResponse.js";
import type { RequestParameters } from "./RequestParameters.js";
import type { Route } from "./Route.js";

import type {
  EndpointKeys,
  Endpoints,
  Simplify,
} from "./generated/Endpoints.js";

/**
 * Parameters that can be passed into `request(route, parameters)` or `endpoint(route, parameters)` methods.
 * This type represents the options when `request.parseSuccessResponseBody` is set to `false`.
 */
type StreamBodyOption = Simplify<
  RequestParameters & { request: { parseSuccessResponseBody: false } }
>;
export interface RequestInterface<D extends object = object> {
  /**
   * Sends a request based on endpoint options
   *
   * @param {object} endpoint Must set `method` and `url`. Plus URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <T = any, O extends RequestParameters = RequestParameters>(
    options: O & { method?: string } & ("url" extends keyof D
        ? { url?: string }
        : { url: string }),
  ): Promise<OctokitResponse<T>>;

  /**
   * Sends a request based on endpoint options
   *
   * @param {object} endpoint Must set `method` and `url`. Plus URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <T = any, O extends StreamBodyOption = StreamBodyOption>(
    options: O & { method?: string } & ("url" extends keyof D
        ? { url?: string }
        : { url: string }),
  ): Promise<OctokitResponse<ReadableStream<T>>>;

  /**
   * Sends a request based on endpoint options
   *
   * @param {string} route Request method + URL. Example: `'GET /orgs/{org}'`
   * @param {object} [parameters] URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <R extends Route, O extends StreamBodyOption>(
    route: keyof Endpoints | R,
    options?: R extends keyof Endpoints
      ? Endpoints[R]["parameters"] & O
      : StreamBodyOption,
  ): R extends keyof Endpoints
    ? Promise<
        OctokitResponse<
          ReadableStream<
            Exclude<Endpoints[R]["response"], keyof OctokitResponse<any>>
          >
        >
      >
    : Promise<OctokitResponse<ReadableStream<any>>>;

  /**
   * Sends a request based on endpoint options
   *
   * @param {string} route Request method + URL. Example: `'GET /orgs/{org}'`
   * @param {object} [parameters] URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <R extends Route>(
    route: EndpointKeys | R,
    options?: R extends EndpointKeys
      ? Endpoints[R]["parameters"] & RequestParameters
      : RequestParameters,
  ): R extends EndpointKeys
    ? Promise<Endpoints[R]["response"]>
    : Promise<OctokitResponse<any>>;

  /**
   * Returns a new `request` with updated route and parameters
   */
  defaults: <O extends RequestParameters = RequestParameters>(
    newDefaults: O,
  ) => RequestInterface<D & O>;

  /**
   * Octokit endpoint API, see {@link https://github.com/octokit/endpoint.js|@octokit/endpoint}
   */
  endpoint: EndpointInterface<D>;
}
