import {unlink} from 'fs/promises';
import { fromHex, generateRandomKey, toHex, writeKey } from './helpers';

test('can generate encryption key', () => {
  const key = toHex(generateRandomKey()).toString();

  expect(key).toContain('0x');
  expect(key).toContain(',');
});

test('can transform plaintext key to comma separated hex', () => {
  const key = 'foo bar baz';
  const hex = '0x66,0x6f,0x6f,0x20,0x62,0x61,0x72,0x20,0x62,0x61,0x7a';

  expect(toHex(key).toString()).toBe(hex);
});

test('can transform comma separated hex to plaintext key', () => {
  const key = 'foo bar baz';
  const hex = '0x66,0x6f,0x6f,0x20,0x62,0x61,0x72,0x20,0x62,0x61,0x7a';

  expect(fromHex(hex).toString()).toBe(key);
});

test('can write encryption key to file', async () => {
  const key = 'foo bar baz';
  const keyFile = 'key-test-remove-me.txt';
  const result = await writeKey(key, keyFile);
  
  expect(result.toString()).toBe(key);
  
  await unlink(keyFile);
});
