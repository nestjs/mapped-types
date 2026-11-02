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
export function OmitType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
) {
  // Property keys are passed as strings, whereas "keyof T" is a number for a
  // numeric property (e.g. a numeric enum member)
  const omittedKeys = keys.map((key) =>
    typeof key === 'number' ? String(key) : key,
  );
  const isInheritedPredicate = (propertyKey: string) =>
    !omittedKeys.includes(propertyKey);

  abstract class OmitClassType {
    constructor() {
      inheritPropertyInitializers(this, classRef, isInheritedPredicate);
    }
  }

  inheritValidationMetadata(classRef, OmitClassType, isInheritedPredicate);
  inheritTransformationMetadata(classRef, OmitClassType, isInheritedPredicate);

  return OmitClassType as MappedType<
    RemoveFieldsWithType<Omit<T, (typeof keys)[number]>, Function>
  >;
}
