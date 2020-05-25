import { Type } from '@nestjs/common';
import {
  applyIsDefinedDecorator,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';

export function RequiredType<T>(classRef: Type<T>): Type<Required<T>> {
  abstract class RequiredClassType {}

  const applyIsDefinedToProperty = (propertyKey: string) =>
    applyIsDefinedDecorator(RequiredClassType, propertyKey);

  inheritValidationMetadata(
    classRef,
    RequiredClassType,
    undefined,
    applyIsDefinedToProperty,
  );
  inheritTransformationMetadata(classRef, RequiredClassType);

  Object.defineProperty(RequiredClassType, 'name', {
    value: `Required${classRef.name}`,
  });
  return RequiredClassType as Type<Required<T>>;
}
