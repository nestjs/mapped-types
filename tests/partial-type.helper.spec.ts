import { classToClass, Expose, Transform, Type } from 'class-transformer';
import { IsString, validate } from 'class-validator';
import { PartialType } from '../lib';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

describe('PartialType', () => {
  class BaseUserDto {
    @IsString()
    @Transform((str) => str + '_transformed')
    @Type(() => String)
    parentProperty!: string;
  }

  class CreateUserDto extends BaseUserDto {
    login: string = 'defaultLogin';

    @Expose()
    @Transform((str) => str + '_transformed')
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

      const transformedDto = classToClass(updateDto);
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
});
