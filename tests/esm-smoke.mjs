/**
 * Smoke test for the *built* ESM output, executed by plain Node.
 *
 * The vitest suite imports `lib/` through vite's transform pipeline, which
 * supplies a `require` shim. That hides ESM-only failures (e.g. a stray
 * `require()` in the emitted `dist/`), so this file deliberately runs against
 * `dist/index.js` with no bundler or transform in between.
 */
import assert from 'node:assert/strict';
import 'reflect-metadata';
import { IsString, validate } from 'class-validator';
import { Expose } from 'class-transformer';
import { PartialType } from '../dist/index.js';

class CreateUserDto {
  firstName;
}
// Applied imperatively: this file is plain JS, so decorator syntax is unavailable.
IsString()(CreateUserDto.prototype, 'firstName');
Expose()(CreateUserDto.prototype, 'firstName');

class UpdateUserDto extends PartialType(CreateUserDto) {}

// If `class-validator` were unreachable from the ESM build, the helpers would
// silently no-op and no metadata would be inherited at all.
const errorsWhenEmpty = await validate(new UpdateUserDto());
assert.deepEqual(
  errorsWhenEmpty,
  [],
  'inherited properties should be optional on a partial type',
);

const invalid = new UpdateUserDto();
invalid.firstName = 123;
const errorsWhenInvalid = await validate(invalid);
assert.equal(
  errorsWhenInvalid.length,
  1,
  'validation metadata should be inherited from the parent class',
);
assert.equal(errorsWhenInvalid[0].property, 'firstName');

console.log('ESM smoke test passed');
