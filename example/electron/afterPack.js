const { join } = require('path');
const asarmor = require('../../build/src');
const { encrypt } = require('../../build/src');

exports.default = async ({ appOutDir, packager }) => {
  try {
    const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');

    // encrypt file contents first
    const src = join(packager.info.projectDir, 'release', 'app');
    const dst = asarPath;
    console.log(`  \x1B[34m•\x1B[0m asarmor encrypting contents of ${src} to ${dst}`);
    const root = join(__dirname, '..', '..');
    await encrypt({
      src,
      dst,
      keyFilePath: join(root, 'build', 'src', 'encryption', 'key.txt'),
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
