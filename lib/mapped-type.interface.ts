import { Type } from '@nestjs/common';

export interface MappedType<T> extends Type<T> {
  new (): T;
}
