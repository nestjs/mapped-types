import { Expose, instanceToInstance, Transform, Type } from 'class-transformer';
import { IsString, validate } from 'class-validator';
import { PartialType } from '../lib';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

describe('PartialType', () => {
  class BaseUserDto {
    @IsString()
    @Transform(({ value }) => value + '_transformed')
    @Type(() => String)
    parentProperty!: string;
  }

  class CreateUserDto extends BaseUserDto {
    login: string = 'defaultLogin';

    @Expose()
    @Transform(({ value }) => value + '_transformed')
    @IsString()
    password!: string;
  }

  class UpdateUserDto extends PartialType(CreateUserDto) {}

  describe('Validation metadata', () => {
    it('should inherit metadata', () => {
      const validationKeys = getValidationMetadataByTarget(UpdateUserDto).map(
        (item) => item.propertyName,
      );
      expect(validationKeys).toEqual([
        'password',
        'parentProperty',
        'password',
        'parentProperty',
      ]);
    });
    describe('when object does not fulfil validation rules', () => {
      it('"validate" should return validation errors', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = 1234567 as any;

        const validationErrors = await validate(updateDto);

        expect(validationErrors.length).toEqual(1);
        expect(validationErrors[0].constraints).toEqual({
          isString: 'password must be a string',
        });
      });
    });
    describe('otherwise', () => {
      it('"validate" should return an empty array', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = '1234567891011';

        const validationErrors = await validate(updateDto);
        expect(validationErrors.length).toEqual(0);
      });
    });
  });

  describe('Transformer metadata', () => {
    it('should inherit transformer metadata', () => {
      const password = '1234567891011';
      const parentProperty = 'test';

      const updateDto = new UpdateUserDto();
      updateDto.password = password;
      updateDto.parentProperty = parentProperty;

      const transformedDto = instanceToInstance(updateDto);
      expect(transformedDto.password).toEqual(password + '_transformed');
      expect(transformedDto.parentProperty).toEqual(
        parentProperty + '_transformed',
      );
    });
  });

  describe('Property initializers', () => {
    it('should inherit property initializers', () => {
      const updateUserDto = new UpdateUserDto();
      expect(updateUserDto.login).toEqual('defaultLogin');
    });
  });

  describe('Configuration options', () => {
    it('should not ignore validations for null properties when `skipNullProperties` is false', async () => {
      class UpdateUserDtoDisallowNull extends PartialType(CreateUserDto, {
        skipNullProperties: false,
      }) {}

      const updateDto = new UpdateUserDtoDisallowNull();
      updateDto.password = null as any;

      const validationErrors = await validate(updateDto);

      expect(validationErrors.length).toBe(1);
      expect(validationErrors[0].constraints).toEqual({
        isString: 'password must be a string',
      });
    });

    it('should ignore validations on null properties when `skipNullProperties` is undefined', async () => {
      const updateDto = new UpdateUserDto();
      updateDto.password = null as any;

      const validationErrors = await validate(updateDto);

      expect(validationErrors.length).toBe(0);
    });

    it('should ignore validations on null properties when `skipNullProperties` is true', async () => {
      class UpdateUserDtoAllowNull extends PartialType(CreateUserDto, {
        skipNullProperties: true,
      }) {}

      const updateDto = new UpdateUserDtoAllowNull();
      updateDto.password = null as any;

      const validationErrors = await validate(updateDto);

      expect(validationErrors.length).toBe(0);
    });
  });
});
