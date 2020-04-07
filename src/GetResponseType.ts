type Unwrap<T> = T extends Promise<infer U> ? U : T;
type AnyFunction = (...args) => any;

export type GetResponseType<T extends AnyFunction> = Unwrap<ReturnType<T>>;
export type GetResponseDataType<T extends AnyFunction> = Unwrap<
  ReturnType<T>
>["data"];
