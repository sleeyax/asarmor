const asar = require('asar');
const asarmor = require('../../build/src');
const {original, protected} = require('./constants');

(async () => {
  // write source files to asar archive
  await asar.createPackageFromFiles('.', original, ['src/index.js', 'src/sum.js', 'package.json']);
  console.log('built archive:', original);

  // apply asarmor patches
  const archive = await asarmor.open(original);
  await archive.createBackup();
  archive.patch(asarmor.createTrashPatch());
  const path = await archive.write(protected);
  console.log('protected archive:', path);
})();
