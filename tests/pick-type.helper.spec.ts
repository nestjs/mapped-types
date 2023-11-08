import { Expose, instanceToInstance, plainToInstance, Transform } from 'class-transformer';
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
        // @ts-expect-error
        updateDto.password;

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

      const transformedDto = instanceToInstance(updateDto);
      expect(transformedDto.login).toEqual(login + '_transformed');
    });

    it('should inherit grandparent transformer metadata', () => {
      const transformExecuteSequenceList: string[] = [];
      class Grandparent {
        @Expose()
        @Transform(function grandparentTransform() {
          transformExecuteSequenceList.push(Grandparent.name);
          return 0;
        })
        value!: number;
      }
      class Parent extends Grandparent {
        @Transform(function parentTransform() {
          transformExecuteSequenceList.push(Parent.name);
          return 1;
        })
        value!: number;
      }
      class Children extends PickType(Parent, ['value']) {
        @Transform(function childrenTransform(params) {
          transformExecuteSequenceList.push(Children.name);
          return params.value
        })
        value!: number;
      }

      const childrenInstance = plainToInstance(Children, {});
      expect(transformExecuteSequenceList[0]).toEqual(Grandparent.name);
      expect(transformExecuteSequenceList[1]).toEqual(Parent.name);
      expect(transformExecuteSequenceList[2]).toEqual(Children.name);
      expect(childrenInstance.value).toEqual(1);
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
