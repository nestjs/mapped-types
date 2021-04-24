import { Type } from '@nestjs/common';
import { MappedType } from './mapped-type.interface';
import {
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';

export function IntersectionType<A, T extends { new (...arg: any): any }[]>(
  classA: Type<A>,
  ...classRefs: T
): MappedType<A> {
  const allClassRefs = [classA, ...classRefs];

  abstract class IntersectionClassType {
    constructor() {
      allClassRefs.forEach((classRef) => {
        inheritPropertyInitializers(this, classRef);
      });
    }
  }

  allClassRefs.forEach((classRef) => {
    inheritValidationMetadata(classRef, IntersectionClassType);
    inheritTransformationMetadata(classRef, IntersectionClassType);
  });

  const intersectedNames = allClassRefs.reduce(
    (prev, ref) => prev + ref.name,
    '',
  );
  Object.defineProperty(IntersectionClassType, 'name', {
    value: `Intersection${intersectedNames}`,
  });
  return IntersectionClassType as MappedType<A>;
}
