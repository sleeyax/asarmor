require('asar-node').register();
const asar = require('asar');
const {original, protected} = require('./constants');
const fs = require('fs');

function test() {
  const archives = [original, protected];

  // check if we can still call exported functions
  for (const archive of archives) {
    const { sum } = require(archive + '/src/sum');
    const a = 1;
    const b = 1;
    console.log(`${archive}: the sum of ${a} + ${b} is still ${sum(a, b)}`);
  }

  // try to extract the archives
  // (trying to extract the protected archive should fail)
  let success = 0;
  for (const archive of archives) {
    try {
      asar.extractAll(archive, 'extracted');
      success++;
      console.log(`${archive}: successfully extracted`);
    } catch (ex) {
      console.log(`${archive}: failed to extract`);
    } finally {
      fs.rmSync('extracted', {recursive: true});
    }
  }

  if (success == 1) {
    console.log('test succeeded')
  } else {
    console.warn('test failed');
  }
}

test();
