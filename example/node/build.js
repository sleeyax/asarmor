const asar = require('@electron/asar');
const asarmor = require('../../build/src');
const {original, protected} = require('./constants');

(async () => {
  // write source files to asar archive
  await asar.createPackageFromFiles('.', original, ['src/index.js', 'src/sum.js', 'package.json']);
  console.log('built archive:', original);

  await asarmor.encrypt({src: original, dst: protected});
  console.log('encrypted archive:', protected);

  // apply asarmor patches
  const archive = await asarmor.open(protected);
  archive.patch(asarmor.createBloatPatch(1));
  const path = await archive.write(protected);
  console.log('protected archive:', path);
})();
