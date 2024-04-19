require('asar-node').register();
const assert = require('assert');
const {test} = require('node:test');
const {original, protected} = require('./constants');

test("node example", () => {
  const archives = [original, protected];

  // try to extract the archives
  // (trying to extract the protected archive should fail)
  let runs = 0;
  for (const archive of archives) {
    try {
      // check if we can still call exported functions
      const { sum } = require('./' + archive + '/src/sum');
      const a = 1;
      const b = 1;
      console.log(`${original}: the sum of ${a} + ${b} is still ${sum(a, b)}`);
      runs++;
    } catch (err) {
      console.log(`${archive}: ${err}`);
    }
  }

  assert.strictEqual(runs, 1);
});
