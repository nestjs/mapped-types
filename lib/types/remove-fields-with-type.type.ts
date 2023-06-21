// With this util we could remove the keys with never type from the original type.
type KeysWithoutType<T, Type> = {
  [K in keyof T]: T[K] extends Type ? never : K;
}[keyof T];

type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];
type RequiredKeys<T> = Exclude<
  KeysOfType<T, Exclude<T[keyof T], undefined>>,
  undefined
>;
type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;

export type RemoveFieldsWithType<T, Type> = {
  [K in KeysWithoutType<Pick<T, RequiredKeys<T>>, Type>]: Pick<
    T,
    RequiredKeys<T>
  >[K];
} & {
  [K in KeysWithoutType<Pick<T, OptionalKeys<T>>, Type>]?: Pick<
    T,
    OptionalKeys<T>
  >[K];
};
