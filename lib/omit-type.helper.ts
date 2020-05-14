import { Type } from '@nestjs/common';
import {
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';

export function OmitType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
): Type<Omit<T, typeof keys[number]>> {
  abstract class OmitClassType {}

  const isInheritedPredicate = (propertyKey: string) =>
    !keys.includes(propertyKey as K);
  inheritValidationMetadata(classRef, OmitClassType, isInheritedPredicate);
  inheritTransformationMetadata(classRef, OmitClassType, isInheritedPredicate);

  return OmitClassType as Type<Omit<T, typeof keys[number]>>;
}
