import { classToClass, Expose, Transform, Type } from 'class-transformer';
import { IsString, validate } from 'class-validator';
import { RequiredType } from '../lib';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

describe('RequiredType', () => {
  class BaseUserDto {
    @IsString()
    @Transform((str) => str + '_transformed')
    @Type(() => String)
    parentProperty!: string;
  }

  class CreateUserDto extends BaseUserDto {
    login!: string;

    @Expose()
    @Transform((str) => str + '_transformed')
    @IsString()
    password!: string;
  }

  class UpdateUserDto extends RequiredType(CreateUserDto) {}

  describe('Validation metadata', () => {
    it('should inherit metadata', () => {
      const validationKeys = getValidationMetadataByTarget(UpdateUserDto).map(
        (item) => item.propertyName,
      );
      expect(validationKeys).toEqual([
        'password',
        'password',
        'parentProperty',
        'parentProperty',
      ]);
    });
    describe('when object does not fulfil validation rules', () => {
      it('"validate" should return validation errors', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = 1234567 as any;

        const validationErrors = await validate(updateDto);

        expect(validationErrors.length).toEqual(2);
        expect(validationErrors[0].constraints).toEqual({
          isString: 'password must be a string',
        });
        expect(validationErrors[1].constraints).toEqual({
          isDefined: 'parentProperty should not be null or undefined',
          isString: 'parentProperty must be a string',
        });
      });
    });
    describe('otherwise', () => {
      it('"validate" should return an empty array', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = '1234567891011';
        updateDto.parentProperty = 'test';

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
});
