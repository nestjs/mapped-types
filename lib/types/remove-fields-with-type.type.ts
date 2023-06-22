type KeysWithType<T, Type> = {
  [K in keyof T]: T[K] extends Type ? K : never;
}[keyof T];

export type RemoveFieldsWithType<T, Type> = Exclude<T, KeysWithType<T, Type>>;
