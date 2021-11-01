const asar = require('asar');
const {Asarmor, createTrashPatch} = require('../../build/src');
const {original, protected} = require('./constants');

(async () => {
  // write source files to asar archive
  await asar.createPackageFromFiles('.', original, ['src/index.js', 'src/sum.js', 'package.json']);
  console.log('built archive:', original);

  // apply asarmor protections
  const asarmor = new Asarmor(original);
  await asarmor.createBackup();
  await asarmor.read();
  asarmor.patch(createTrashPatch());
  const path = await asarmor.write(protected);
  console.log('protected archive:', path);
})();
