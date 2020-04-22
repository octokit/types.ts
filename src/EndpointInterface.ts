import { EndpointDefaults } from "./EndpointDefaults";
import { RequestOptions } from "./RequestOptions";
import { RequestParameters } from "./RequestParameters";
import { Route } from "./Route";
import { Url } from "./Url";
import { RequestMethod } from "./RequestMethod";

import { Endpoints } from "./generated/Endpoints";

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type EndpointsByUrlAndMethod = UnionToIntersection<
  {
    [K in keyof Endpoints]: {
      [TUrl in Endpoints[K]["request"]["url"]]: {
        [TMethod in Endpoints[K]["request"]["method"]]: {
          route: {
            url: TUrl;
            method: TMethod;
          };
          parameters: Endpoints[K]["parameters"];
          request: Endpoints[K]["request"];
        };
      };
    };
  }[keyof Endpoints]
>;

type UnknownRouteObject = {
  method?: RequestMethod;
  url: string;
};
type UnknownEndpointParameters = RequestParameters & UnknownRouteObject;

type KnownOrUnknownEndpointsByUrlAndMethod<
  T extends UnknownEndpointParameters
> = T["url"] extends keyof EndpointsByUrlAndMethod
  ? T["method"] extends keyof EndpointsByUrlAndMethod[T["url"]]
    ? EndpointsByUrlAndMethod[T["url"]][T["method"]] extends {
        parameters: infer TParams;
        request: infer TRequest;
      }
      ? { parameters: TParams; request: TRequest }
      : never
    : never
  : {
      parameters: UnknownEndpointParameters;
      request: RequestOptions;
    };

// https://stackoverflow.com/a/61281317/206879
type KnownOptions<T> = T extends {
  [k in keyof T]: {
    [k: string]: infer OptionValue;
  };
}
  ? OptionValue
  : never;

type KnownRouteObjects = KnownOptions<EndpointsByUrlAndMethod>["route"];
type KnownRouteObject = { method: RequestMethod; url: Url };
type RouteObjectFrom<T extends KnownRouteObject> = {
  method: T["method"];
  url: T["url"];
};

export interface EndpointInterface<D extends object = object> {
  /**
   * Transforms a GitHub REST API endpoint into generic request options
   *
   * @param {object} endpoint Must set `url` unless it's set defaults. Plus URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  // WIP: does not allow optionsk for unknown routes, does not respect `D`
  <O extends KnownRouteObjects>(
    options: O &
      KnownOrUnknownEndpointsByUrlAndMethod<O>["parameters"] &
      RequestParameters
  ): KnownOrUnknownEndpointsByUrlAndMethod<O>["request"];

  // WIP: does not validate required parameters for known route:
  // <O extends RequestParameters>(
  //   options: O extends KnownRouteObject
  //     ? RouteObjectFrom<D & O> extends KnownRouteObjects
  //       ? KnownOrUnknownEndpointsByUrlAndMethod<
  //           RouteObjectFrom<D & O>
  //         >["parameters"]
  //       : O & { method?: string } & ("url" extends keyof D
  //             ? { url?: string }
  //             : { url: string })
  //     : O & { method?: string } & ("url" extends keyof D
  //           ? { url?: string }
  //           : { url: string })
  // ): O extends KnownRouteObject
  //   ? RouteObjectFrom<D & O> extends KnownRouteObjects
  //     ? KnownOrUnknownEndpointsByUrlAndMethod<RouteObjectFrom<D & O>>["request"]
  //     : RequestOptions & Pick<D & O, keyof RequestOptions>
  //   : RequestOptions & Pick<D & O, keyof RequestOptions>;

  /**
   * Transforms a GitHub REST API endpoint into generic request options
   *
   * @param {string} route Request method + URL. Example: `'GET /orgs/:org'`
   * @param {object} [parameters] URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  <
    R extends Route,
    P extends RequestParameters = R extends keyof Endpoints
      ? Endpoints[R]["parameters"] & RequestParameters
      : RequestParameters
  >(
    route: keyof Endpoints | R,
    parameters?: P
  ): (R extends keyof Endpoints ? Endpoints[R]["request"] : RequestOptions) &
    Pick<P, keyof RequestOptions>;

  /**
   * Object with current default route and parameters
   */
  DEFAULTS: D & EndpointDefaults;

  /**
   * Returns a new `endpoint` interface with new defaults
   */
  defaults: <O extends RequestParameters = RequestParameters>(
    newDefaults: O
  ) => EndpointInterface<D & O>;

  merge: {
    /**
     * Merges current endpoint defaults with passed route and parameters,
     * without transforming them into request options.
     *
     * @param {string} route Request method + URL. Example: `'GET /orgs/:org'`
     * @param {object} [parameters] URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
     *
     */
    <
      R extends Route,
      P extends RequestParameters = R extends keyof Endpoints
        ? Endpoints[R]["parameters"] & RequestParameters
        : RequestParameters
    >(
      route: keyof Endpoints | R,
      parameters?: P
    ): D &
      (R extends keyof Endpoints
        ? Endpoints[R]["request"] & Endpoints[R]["parameters"]
        : EndpointDefaults) &
      P;

    /**
     * Merges current endpoint defaults with passed route and parameters,
     * without transforming them into request options.
     *
     * @param {object} endpoint Must set `method` and `url`. Plus URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
     */
    <P extends RequestParameters = RequestParameters>(
      options: P
    ): EndpointDefaults & D & P;

    /**
     * Returns current default options.
     *
     * @deprecated use endpoint.DEFAULTS instead
     */
    (): D & EndpointDefaults;
  };

  /**
   * Stateless method to turn endpoint options into request options.
   * Calling `endpoint(options)` is the same as calling `endpoint.parse(endpoint.merge(options))`.
   *
   * @param {object} options `method`, `url`. Plus URL, query or body parameters, as well as `headers`, `mediaType.{format|previews}`, `request`, or `baseUrl`.
   */
  parse: <O extends EndpointDefaults = EndpointDefaults>(
    options: O
  ) => RequestOptions & Pick<O, keyof RequestOptions>;
}
