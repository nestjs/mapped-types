import { Type } from '@nestjs/common';
import { MappedType } from './mapped-type.interface';
import {
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';

export function IntersectionType<A, B>(
  classARef: Type<A>,
  classBRef: Type<B>,
): MappedType<A & B> {
  abstract class IntersectionClassType {}

  inheritValidationMetadata(classARef, IntersectionClassType);
  inheritValidationMetadata(classBRef, IntersectionClassType);
  inheritTransformationMetadata(classARef, IntersectionClassType);
  inheritTransformationMetadata(classBRef, IntersectionClassType);

  Object.defineProperty(IntersectionClassType, 'name', {
    value: `Intersection${classARef.name}${classBRef.name}`,
  });
  return IntersectionClassType as MappedType<A & B>;
}
