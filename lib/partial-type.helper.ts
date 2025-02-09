import { Type } from '@nestjs/common';
import { MappedType } from './mapped-type.interface';
import {
  applyIsOptionalDecorator,
  applyValidateIfDefinedDecorator,
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';
import { RemoveFieldsWithType } from './types/remove-fields-with-type.type';

/**
 * @publicApi
 */
export function PartialType<T>(
  classRef: Type<T>,
  /**
   *  Configuration options.
   */
  options: {
    /**
     * If true, validations will be ignored on a property if it is either null or undefined. If
     * false, validations will be ignored only if the property is undefined.
     * @default true
     */
    skipNullProperties?: boolean;
  } = {},
) {
  abstract class PartialClassType {
    constructor() {
      inheritPropertyInitializers(this, classRef);
    }
  }

  const propertyKeys = inheritValidationMetadata(classRef, PartialClassType);
  inheritTransformationMetadata(classRef, PartialClassType);

  if (propertyKeys) {
    propertyKeys.forEach((key) => {
      options.skipNullProperties === false
        ? applyValidateIfDefinedDecorator(PartialClassType, key)
        : applyIsOptionalDecorator(PartialClassType, key);
    });
  }

  Object.defineProperty(PartialClassType, 'name', {
    value: `Partial${classRef.name}`,
  });

  return PartialClassType as MappedType<
    RemoveFieldsWithType<Partial<T>, Function>
  >;
}
