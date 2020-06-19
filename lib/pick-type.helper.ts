import { Type } from '@nestjs/common';
import { MappedType } from './mapped-type.interface';
import {
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';

export function PickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
): MappedType<Pick<T, typeof keys[number]>> {
  abstract class PickClassType {}

  const isInheritedPredicate = (propertyKey: string) =>
    keys.includes(propertyKey as K);
  inheritValidationMetadata(classRef, PickClassType, isInheritedPredicate);
  inheritTransformationMetadata(classRef, PickClassType, isInheritedPredicate);

  return PickClassType as MappedType<Pick<T, typeof keys[number]>>;
}
