import { Type } from '@nestjs/common';
import { MappedType } from './mapped-type.interface';
import {
  applyIsOptionalDecorator,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';

export function PartialType<T>(classRef: Type<T>): MappedType<Partial<T>> {
  abstract class PartialClassType {}

  const propertyKeys = inheritValidationMetadata(classRef, PartialClassType);
  inheritTransformationMetadata(classRef, PartialClassType);

  if (propertyKeys) {
    propertyKeys.forEach((key) => {
      applyIsOptionalDecorator(PartialClassType, key);
    });
  }

  Object.defineProperty(PartialClassType, 'name', {
    value: `Partial${classRef.name}`,
  });
  return PartialClassType as MappedType<Partial<T>>;
}
