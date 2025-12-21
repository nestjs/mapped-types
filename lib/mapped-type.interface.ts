import type { Type } from '@nestjs/common';

/**
 * @publicApi
 */
export interface MappedType<T> extends Type<T> {
  new (): T;
}
