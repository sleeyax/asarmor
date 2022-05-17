const {join} = require('path');
const {spawn} = require('./spawn');

(async function () {
  let electronVersion = process.env.npm_config_target;

  if (!electronVersion) {
    try {
      electronVersion = require(join(require.resolve('electron'), '..', 'package.json')).version;
    } catch (_) {
      // should give a default electron target version?
      electronVersion = '16.0.2';
    }
  }

  await spawn('node', [
    join(require.resolve('node-gyp'), '../..', 'bin', 'node-gyp.js'),
    'configure',
    `--target=${electronVersion}`,
    '--disturl=https://electronjs.org/headers'
  ], { cwd: join(__dirname, '..') });
})();
