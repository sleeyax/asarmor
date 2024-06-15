/* eslint-disable no-console */
const { join } = require('path');
const { copyFile } = require('fs/promises');

exports.default = async (context) => {
  try {
    console.log('  \x1B[34m•\x1B[0m copying native dependencies');

    const root = join(__dirname, '..', '..');

    // copy main.node
    await copyFile(
      join(root, 'build', 'Release', 'main.node'),
      join(
        context.packager.info.projectDir,
        'release',
        'app',
        'dist',
        'main',
        'main.node'
      )
    );

    // copy renderer.node
    await copyFile(
      join(root, 'build', 'Release', 'renderer.node'),
      join(
        context.packager.info.projectDir,
        'release',
        'app',
        'dist',
        'renderer',
        'renderer.node'
      )
    );
  } catch (err) {
    console.error(err);
  }
};
