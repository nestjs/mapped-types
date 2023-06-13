// With this util we could remove the keys with never type from the original type.
type KeysWithoutType<T, Type> = {
  [K in keyof T]: T[K] extends Type ? never : K;
}[keyof T];

export type RemoveFieldsWithType<T, Type> = {
  [K in KeysWithoutType<T, Type>]: T[K];
};
