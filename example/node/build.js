const asar = require('@electron/asar');
const asarmor = require('../../build/src');
const {original, protected} = require('./constants');

(async () => {
  // write source files to asar archive
  await asar.createPackageFromFiles('.', original, ['src/index.js', 'src/sum.js', 'package.json']);
  console.log('built archive:', original);

  await asarmor.encrypt({src: original, dst: protected, key: '0x1e,0x79,0x7a,0x06,0x52,0xbe,0x5c,0x69,0xa1,0x8d,0x51,0x11,0x5e,0x4f,0xd4,0xfe,0x5d,0x66,0x03,0x8d,0x40,0x86,0xf2,0x53,0x2f,0x32,0xf0,0x84,0xef,0x27,0x3e,0xa1'});
  console.log('encrypted archive:', protected);

  // apply asarmor patches
  const archive = await asarmor.open(protected);
  archive.patch(asarmor.createBloatPatch(1));
  const path = await archive.write(protected);
  console.log('protected archive:', path);
})();
