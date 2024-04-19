/* eslint-disable no-console */
const { join } = require('path');
const asarmor = require('../../build/src');
const { encrypt } = require('../../build/src');

exports.default = async ({ appOutDir, packager }) => {
  try {
    const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');

    console.log(
      `  \x1B[34m•\x1B[0m asarmor encrypting contents of ${asarPath}`
    );
    const root = join(__dirname, '..', '..');
    await encrypt({
      src: asarPath,
      dst: asarPath,
    });

    // then patch the header
    console.log(`  \x1B[34m•\x1B[0m asarmor applying patches to ${asarPath}`);
    const archive = await asarmor.open(asarPath);
    archive.patch(); // apply default patches
    await archive.write(asarPath);
  } catch (err) {
    console.error(err);
  }
};
