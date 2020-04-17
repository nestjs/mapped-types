import { classToClass, Transform } from 'class-transformer';
import { IsString, MinLength, validate } from 'class-validator';
import { IntersectionType } from '../lib';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

describe('IntersectionType', () => {
  class ClassA {
    @MinLength(10)
    login!: string;

    @Transform(str => str + '_transformed')
    @MinLength(10)
    password!: string;
  }

  class ClassB {
    @IsString()
    firstName!: string;

    @Transform(str => str + '_transformed')
    @MinLength(5)
    lastName!: string;
  }

  class UpdateUserDto extends IntersectionType(ClassA, ClassB) {}

  describe('Validation metadata', () => {
    it('should inherit metadata for all properties from class A and class B', () => {
      const validationKeys = getValidationMetadataByTarget(UpdateUserDto).map(
        item => item.propertyName,
      );
      expect(validationKeys).toEqual([
        'login',
        'password',
        'firstName',
        'lastName',
      ]);
    });
    describe('when object does not fulfil validation rules', () => {
      it('"validate" should return validation errors', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = '1234567';

        const validationErrors = await validate(updateDto);

        expect(validationErrors.length).toEqual(4);
        expect(validationErrors[0].constraints).toEqual({
          minLength: 'login must be longer than or equal to 10 characters',
        });
        expect(validationErrors[1].constraints).toEqual({
          minLength: 'password must be longer than or equal to 10 characters',
        });
        expect(validationErrors[2].constraints).toEqual({
          isString: 'firstName must be a string',
        });
        expect(validationErrors[3].constraints).toEqual({
          minLength: 'lastName must be longer than or equal to 5 characters',
        });
      });
    });
    describe('otherwise', () => {
      it('"validate" should return an empty array', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = '1234567891011';
        updateDto.firstName = 'firstNameTest';
        updateDto.lastName = 'lastNameTest';
        updateDto.login = 'mylogintesttest';

        const validationErrors = await validate(updateDto);
        expect(validationErrors.length).toEqual(0);
      });
    });
  });

  describe('Transformer metadata', () => {
    it('should inherit transformer metadata', () => {
      const password = '1234567891011';
      const lastName = 'lastNameTest';

      const updateDto = new UpdateUserDto();
      updateDto.password = password;
      updateDto.lastName = lastName;

      const transformedDto = classToClass(updateDto);
      expect(transformedDto.lastName).toEqual(lastName + '_transformed');
      expect(transformedDto.password).toEqual(password + '_transformed');
    });
  });
});
