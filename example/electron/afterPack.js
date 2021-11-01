const { Asarmor } = require('../../build/src');
const { join } = require("path");

exports.default = async ({ appOutDir, packager }) => {
  try {
    const asarPath = join(packager.getResourcesDir(appOutDir), 'app.asar');
    console.log(`applying asarmor patches to ${asarPath}`);
    const asarmor = new Asarmor(asarPath);
    await asarmor.read();
    asarmor.patch(); // apply default patches
    await asarmor.write(asarPath);
  } catch (err) {
    console.error(err);
  }
};
