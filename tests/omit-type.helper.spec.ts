import {
  Expose,
  instanceToInstance,
  plainToInstance,
  Transform,
  Type,
} from 'class-transformer';
import { MinLength, validate } from 'class-validator';
import { OmitType } from '../lib';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

describe('OmitType', () => {
  class CreateUserDto {
    @MinLength(10)
    login!: string;

    @Transform(({ value }) => value + '_transformed')
    @MinLength(10)
    password = 'defaultPassword';
  }

  class UpdateUserDto extends OmitType(CreateUserDto, ['login']) {}

  describe('Validation metadata', () => {
    it('should inherit metadata with "login" property excluded', () => {
      const validationKeys = getValidationMetadataByTarget(UpdateUserDto).map(
        (item) => item.propertyName,
      );
      expect(validationKeys).toEqual(['password']);
    });

    describe('when object does not fulfil validation rules', () => {
      it('"validate" should return validation errors', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = '1234567';
        // @ts-expect-error
        updateDto.login;

        const validationErrors = await validate(updateDto);

        expect(validationErrors.length).toEqual(1);
        expect(validationErrors[0].constraints).toEqual({
          minLength: 'password must be longer than or equal to 10 characters',
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
      const updateDto = new UpdateUserDto();
      updateDto.password = password;

      const transformedDto = instanceToInstance(updateDto);
      expect(transformedDto.password).toEqual(password + '_transformed');
    });

    it('should inherit expose and type transformer metadata', () => {
      let isGrandparentTypeExecute = false;
      let isParentTypeExecute = false;
      class Grandparent {
        @Expose()
        a!: string | number;

        @Expose()
        @Type(function grandparentType() {
          isGrandparentTypeExecute = true;
          return Number;
        })
        b!: string | number;
      }
      class Parent extends OmitType(Grandparent, ['a']) {
        @Expose()
        @Type(function parentType() {
          isParentTypeExecute = true;
          return String;
        })
        b!: number;
        c!: string; // not expose

        @Type(() => Number)
        d!: string | number;
      }
      class Children extends OmitType(Parent, ['d']) {
        @Expose()
        d!: string;
      }

      const childrenOmitInstance = plainToInstance(
        Children,
        { a: 'a', b: 'b', c: 'c', d: 'd' },
        { excludeExtraneousValues: true },
      );

      const expectKeySet = new Set(['b', 'd']);
      const concreteKeyList = Object.keys(childrenOmitInstance);
      for (let i = 0; i < concreteKeyList.length; i++) {
        expect(expectKeySet.has(concreteKeyList[i])).toEqual(true);
      }
      expect(concreteKeyList.length).toEqual(expectKeySet.size);
      expect(isGrandparentTypeExecute).toEqual(false);
      expect(isParentTypeExecute).toEqual(true);
      expect(childrenOmitInstance.b).toEqual('b');
      expect(childrenOmitInstance.c).toEqual(undefined);
      expect(childrenOmitInstance.d).toEqual('d');
    });
  });

  describe('Property initializers', () => {
    it('should inherit property initializers', () => {
      const updateUserDto = new UpdateUserDto();
      expect((updateUserDto as any)['login']).toBeUndefined();
      expect(updateUserDto.password).toEqual('defaultPassword');
    });
  });
});
