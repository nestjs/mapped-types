import type { Type } from '@nestjs/common';

import { MappedType } from './mapped-type.interface';
import {
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';
import type { RemoveFieldsWithType } from './types/remove-fields-with-type.type';

// https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

// Converts ClassRefs array `Type<Class>[]` to `Class[]` using `infer`
// e.g. `ClassRefsToConstructors<[Type<Foo>, Type<Bar>]>` becomes `[Foo, Bar]`
type ClassRefsToConstructors<T extends Type[]> = {
  [U in keyof T]: T[U] extends Type<infer V> ? V : never;
};

// Firstly, it uses indexed access type `Class[][number]` to convert `Class[]` to union type of it
// e.g. `[Foo, Bar][number]` becomes `Foo | Bar`
// then, uses the `UnionToIntersection` type to transform union type to intersection type
// e.g. `Foo | Bar` becomes `Foo & Bar`
// finally, returns `MappedType` passing the generated intersection type as a type argument
type Intersection<T extends Type[]> = MappedType<
  RemoveFieldsWithType<
    UnionToIntersection<ClassRefsToConstructors<T>[number]>,
    Function
  >
>;

/**
 * @publicApi
 */
export function IntersectionType<T extends Type[]>(...classRefs: T) {
  abstract class IntersectionClassType {
    constructor() {
      classRefs.forEach((classRef) => {
        inheritPropertyInitializers(this, classRef);
      });
    }
  }

  classRefs.forEach((classRef) => {
    inheritValidationMetadata(classRef, IntersectionClassType);
    inheritTransformationMetadata(
      classRef,
      IntersectionClassType,
      undefined,
      false,
    );
  });

  const intersectedNames = classRefs.reduce((prev, ref) => prev + ref.name, '');
  Object.defineProperty(IntersectionClassType, 'name', {
    value: `Intersection${intersectedNames}`,
  });

  return IntersectionClassType as Intersection<T>;
}
