import { Type } from '@nestjs/common';
import {
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';

export function IntersectionType<A, B>(
  classARef: Type<A>,
  classBRef: Type<B>,
): Type<A & B> {
  abstract class IntersectionClassType {
    constructor() {
      inheritPropertyInitializers(this, classARef);
      inheritPropertyInitializers(this, classBRef);
    }
  }

  inheritValidationMetadata(classARef, IntersectionClassType);
  inheritValidationMetadata(classBRef, IntersectionClassType);
  inheritTransformationMetadata(classARef, IntersectionClassType);
  inheritTransformationMetadata(classBRef, IntersectionClassType);

  Object.defineProperty(IntersectionClassType, 'name', {
    value: `Intersection${classARef.name}${classBRef.name}`,
  });
  return IntersectionClassType as Type<A & B>;
}
