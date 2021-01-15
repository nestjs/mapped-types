import { classToClass, Transform } from 'class-transformer';
import { MinLength, validate } from 'class-validator';
import { PickType } from '../lib';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

describe('PickType', () => {
  class CreateUserDto {
    @Transform(({ value }) => value + '_transformed')
    @MinLength(10)
    login = 'defaultLogin';

    @MinLength(10)
    password!: string;
  }

  class UpdateUserDto extends PickType(CreateUserDto, ['login']) {}

  describe('Validation metadata', () => {
    it('should inherit metadata with "password" property excluded', () => {
      const validationKeys = getValidationMetadataByTarget(UpdateUserDto).map(
        (item) => item.propertyName,
      );
      expect(validationKeys).toEqual(['login']);
    });
    describe('when object does not fulfil validation rules', () => {
      it('"validate" should return validation errors', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.login = '1234567';

        const validationErrors = await validate(updateDto);

        expect(validationErrors.length).toEqual(1);
        expect(validationErrors[0].constraints).toEqual({
          minLength: 'login must be longer than or equal to 10 characters',
        });
      });
    });
    describe('otherwise', () => {
      it('"validate" should return an empty array', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.login = '1234567891011';

        const validationErrors = await validate(updateDto);
        expect(validationErrors.length).toEqual(0);
      });
    });
  });

  describe('Transformer metadata', () => {
    it('should inherit transformer metadata', () => {
      const login = '1234567891011';
      const updateDto = new UpdateUserDto();
      updateDto.login = login;

      const transformedDto = classToClass(updateDto);
      expect(transformedDto.login).toEqual(login + '_transformed');
    });
  });

  describe('Property initializers', () => {
    it('should inherit property initializers', () => {
      const updateUserDto = new UpdateUserDto();
      expect((updateUserDto as any)['password']).toBeUndefined();
      expect(updateUserDto.login).toEqual('defaultLogin');
    });
  });
});
