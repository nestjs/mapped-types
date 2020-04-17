import { Type } from '@nestjs/common';
import {
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';

export function IntersectionType<A, B>(
  classARef: Type<A>,
  classBRef: Type<B>,
): Type<A & B> {
  abstract class IntersectionClassType {}

  inheritValidationMetadata(classARef, IntersectionClassType);
  inheritTransformationMetadata(classARef, IntersectionClassType);
  inheritValidationMetadata(classBRef, IntersectionClassType);
  inheritTransformationMetadata(classBRef, IntersectionClassType);

  Object.defineProperty(IntersectionClassType, 'name', {
    value: `Intersection${classARef.name}${classBRef.name}`,
  });
  return IntersectionClassType as Type<A & B>;
}
