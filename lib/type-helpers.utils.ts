import { Logger, Type } from '@nestjs/common';

/* eslint-disable @typescript-eslint/no-var-requires */
const logger = new Logger('MappedTypes');

export function applyIsOptionalDecorator(
  targetClass: Function,
  propertyKey: string,
) {
  if (!isClassValidatorAvailable()) {
    return;
  }
  const classValidator: typeof import('class-validator') = require('class-validator');
  const decoratorFactory = classValidator.IsOptional();
  decoratorFactory(targetClass.prototype, propertyKey);
}

export function inheritValidationMetadata(
  parentClass: Type<any>,
  targetClass: Function,
  isPropertyInherited?: (key: string) => boolean,
) {
  if (!isClassValidatorAvailable()) {
    return;
  }
  try {
    const classValidator: typeof import('class-validator') = require('class-validator');
    const metadataStorage: import('class-validator').MetadataStorage = (
      classValidator as any
    ).getMetadataStorage
      ? (classValidator as any).getMetadataStorage()
      : classValidator.getFromContainer(classValidator.MetadataStorage);

    const getTargetValidationMetadatasArgs = [parentClass, null!, false, false];
    const targetMetadata: ReturnType<
      typeof metadataStorage.getTargetValidationMetadatas
    > = (metadataStorage.getTargetValidationMetadatas as Function)(
      ...getTargetValidationMetadatasArgs,
    );
    return targetMetadata
      .filter(
        ({ propertyName }) =>
          !isPropertyInherited || isPropertyInherited(propertyName),
      )
      .map((value) => {
        const originalType = Reflect.getMetadata(
          'design:type',
          parentClass.prototype,
          value.propertyName,
        );
        if (originalType) {
          Reflect.defineMetadata(
            'design:type',
            originalType,
            targetClass.prototype,
            value.propertyName,
          );
        }

        metadataStorage.addValidationMetadata({
          ...value,
          target: targetClass,
        });
        return value.propertyName;
      });
  } catch (err) {
    logger.error(
      `Validation ("class-validator") metadata cannot be inherited for "${parentClass.name}" class.`,
    );
    logger.error(err);
  }
}

type TransformMetadataKey =
  | '_excludeMetadatas'
  | '_exposeMetadatas'
  | '_typeMetadatas'
  | '_transformMetadatas';

export function inheritTransformationMetadata(
  parentClass: Type<any>,
  targetClass: Function,
  isPropertyInherited?: (key: string) => boolean,
) {
  if (!isClassTransformerAvailable()) {
    return;
  }
  try {
    const transformMetadataKeys: TransformMetadataKey[] = [
      '_excludeMetadatas',
      '_exposeMetadatas',
      '_transformMetadatas',
      '_typeMetadatas',
    ];
    transformMetadataKeys.forEach((key) =>
      inheritTransformerMetadata(
        key,
        parentClass,
        targetClass,
        isPropertyInherited,
      ),
    );
  } catch (err) {
    logger.error(
      `Transformer ("class-transformer") metadata cannot be inherited for "${parentClass.name}" class.`,
    );
    logger.error(err);
  }
}

function inheritTransformerMetadata(
  key: TransformMetadataKey,
  parentClass: Type<any>,
  targetClass: Function,
  isPropertyInherited?: (key: string) => boolean,
) {
  let classTransformer: any;
  try {
    /** "class-transformer" >= v0.3.x */
    classTransformer = require('class-transformer/cjs/storage');
  } catch {
    /** "class-transformer" <= v0.3.x */
    classTransformer = require('class-transformer/storage');
  }
  const metadataStorage /*: typeof import('class-transformer/types/storage').defaultMetadataStorage */ =
    classTransformer.defaultMetadataStorage;

  while (parentClass && parentClass !== Object) {
    if (metadataStorage[key].has(parentClass)) {
      const metadataMap = metadataStorage[key] as Map<
        Function,
        Map<string, any>
      >;
      const parentMetadata = metadataMap.get(parentClass);

      const targetMetadataEntries: Iterable<[string, any]> = Array.from(
        parentMetadata!.entries(),
      )
        .filter(([key]) => !isPropertyInherited || isPropertyInherited(key))
        .map(([key, metadata]) => {
          if (Array.isArray(metadata)) {
            // "_transformMetadatas" is an array of elements
            const targetMetadata = metadata.map((item) => ({
              ...item,
              target: targetClass,
            }));
            return [key, targetMetadata];
          }
          return [key, { ...metadata, target: targetClass }];
        });

      if (metadataMap.has(targetClass)) {
        const existingRules = metadataMap.get(targetClass)!.entries();
        metadataMap.set(
          targetClass,
          new Map([...existingRules, ...targetMetadataEntries]),
        );
      } else {
        metadataMap.set(targetClass, new Map(targetMetadataEntries));
      }
    }
    parentClass = Object.getPrototypeOf(parentClass);
  }
}

function isClassValidatorAvailable() {
  try {
    require('class-validator');
    return true;
  } catch {
    return false;
  }
}

function isClassTransformerAvailable() {
  try {
    require('class-transformer');
    return true;
  } catch {
    return false;
  }
}

function getPropertyDescriptors(obj: any): {
  [x: string]: PropertyDescriptor;
} {
  const prototype = Object.getPrototypeOf(obj);
  return prototype
    ? Object.assign(
        Object.getOwnPropertyDescriptors(obj),
        getPropertyDescriptors(prototype),
      )
    : {};
}

export function inheritPropertyInitializers(
  target: Record<string, any>,
  sourceClass: Type<any>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPropertyInherited = (key: string) => true,
) {
  try {
    const tempInstance = new sourceClass();
    const descriptors = getPropertyDescriptors(tempInstance);

    const targetDescriptors = Object.keys(descriptors)
      .filter(
        (propertyKey) =>
          isPropertyInherited(propertyKey) && propertyKey !== 'constructor',
      )
      .reduce(
        (d, propertyKey) =>
          Object.assign(d, { [propertyKey]: descriptors[propertyKey] }),
        {},
      );
    Object.defineProperties(target, targetDescriptors);
  } catch {}
}
