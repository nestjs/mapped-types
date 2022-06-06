import { MetadataStorage } from '@nestjs/class-validator';

export function getValidationMetadataByTarget(target: Function) {
  const classValidator: typeof import('@nestjs/class-validator') = require('@nestjs/class-validator');
  const metadataStorage: MetadataStorage = (classValidator as any)
    .getMetadataStorage
    ? (classValidator as any).getMetadataStorage()
    : classValidator.getFromContainer(classValidator.MetadataStorage);

  const targetMetadata = metadataStorage.getTargetValidationMetadatas(
    target,
    null!,
    false,
    false,
  );
  return targetMetadata;
}
