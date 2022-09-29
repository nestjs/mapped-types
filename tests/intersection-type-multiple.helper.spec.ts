import { instanceToInstance, Transform } from 'class-transformer';
import { IsString, MinLength, validate } from 'class-validator';
import { IntersectionType } from '../lib';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

describe('IntersectionType', () => {
  class ClassA {
    @MinLength(10)
    login = 'defaultLoginWithMin10Chars';

    @Transform(({ value }) => value + '_transformed')
    @MinLength(10)
    password!: string;
  }

  class ClassB {
    @IsString()
    firstName = 'defaultFirst';

    @Transform(({ value }) => value + '_transformed')
    @MinLength(5)
    lastName!: string;
  }

  class ClassC {
    @MinLength(10)
    hash = 'defaultHashWithMin5Chars';

    @Transform(({ value }) => value + '_transformed')
    @MinLength(5)
    patronymic!: string;
  }

  class ClassD {
    @IsString()
    alpha = 'defaultStringAlpha';
  }

  class ClassE {
    @IsString()
    beta = 'defaultStringBeta';
  }

  class UpdateUserDto extends IntersectionType(
    ClassA,
    ClassB,
    ClassC,
    ClassD,
    ClassE,
  ) {}

  describe('Validation metadata', () => {
    it('should inherit metadata for all properties from class A and class B', () => {
      const validationKeys = getValidationMetadataByTarget(UpdateUserDto).map(
        (item) => item.propertyName,
      );
      expect(validationKeys).toEqual([
        'login',
        'password',
        'firstName',
        'lastName',
        'hash',
        'patronymic',
        'alpha',
        'beta',
      ]);
    });
    describe('when object does not fulfil validation rules', () => {
      it('"validate" should return validation errors', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = '1234567';

        const validationErrors = await validate(updateDto);

        expect(validationErrors.length).toEqual(3);
        expect(validationErrors[0].constraints).toEqual({
          minLength: 'password must be longer than or equal to 10 characters',
        });
        expect(validationErrors[1].constraints).toEqual({
          minLength: 'lastName must be longer than or equal to 5 characters',
        });
        expect(validationErrors[2].constraints).toEqual({
          minLength: 'patronymic must be longer than or equal to 5 characters',
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
        updateDto.patronymic = 'patronymicTest';
        updateDto.alpha = 'alphaTest';
        updateDto.beta = 'betaTest';

        const validationErrors = await validate(updateDto);
        expect(validationErrors.length).toEqual(0);
      });
    });
  });

  describe('Transformer metadata', () => {
    it('should inherit transformer metadata', () => {
      const password = '1234567891011';
      const lastName = 'lastNameTest';
      const patronymic = 'patronymicTest';

      const updateDto = new UpdateUserDto();
      updateDto.password = password;
      updateDto.lastName = lastName;
      updateDto.patronymic = patronymic;

      const transformedDto = instanceToInstance(updateDto);
      expect(transformedDto.lastName).toEqual(lastName + '_transformed');
      expect(transformedDto.password).toEqual(password + '_transformed');
      expect(transformedDto.patronymic).toEqual(patronymic + '_transformed');
    });
  });

  describe('Property initializers', () => {
    it('should inherit property initializers', () => {
      const updateUserDto = new UpdateUserDto();
      expect(updateUserDto.login).toEqual('defaultLoginWithMin10Chars');
      expect(updateUserDto.firstName).toEqual('defaultFirst');
      expect(updateUserDto.hash).toEqual('defaultHashWithMin5Chars');
      expect(updateUserDto.alpha).toEqual('defaultStringAlpha');
      expect(updateUserDto.beta).toEqual('defaultStringBeta');
    });
  });
});
