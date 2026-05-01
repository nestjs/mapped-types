import type { Type } from '@nestjs/common';
import type { MappedType } from './mapped-type.interface.js';
import {
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils.js';
import type { RemoveFieldsWithType } from './types/remove-fields-with-type.type.js';

/**
 * @publicApi
 */
export function PickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
) {
  const isInheritedPredicate = (propertyKey: string) =>
    keys.includes(propertyKey as K);

  abstract class PickClassType {
    constructor() {
      inheritPropertyInitializers(this, classRef, isInheritedPredicate);
    }
  }
  inheritValidationMetadata(classRef, PickClassType, isInheritedPredicate);
  inheritTransformationMetadata(classRef, PickClassType, isInheritedPredicate);

  return PickClassType as MappedType<
    RemoveFieldsWithType<Pick<T, (typeof keys)[number]>, Function>
  >;
}
