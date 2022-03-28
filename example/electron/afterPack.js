const { join } = require('path');
const asarmor = require('../../build/src');

exports.default = async ({ appOutDir, packager }) => {
  try {
    const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');
    console.log(`applying asarmor patches to ${asarPath}`);
    const archive = await asarmor.open(asarPath);
    archive.patch(); // apply default patches
    await archive.write(asarPath);
  } catch (err) {
    console.error(err);
  }
};
