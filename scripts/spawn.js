/**
 * @param {string} command 
 * @param {string[]} args 
 * @param {import('child_process').SpawnOptions} options 
 * @returns {Promise<void> & { cp: import('child_process').ChildProcess }}
 */
function spawn (command, args, options = {}) {
  const argsString = args.map(a => a.indexOf(' ') !== -1 ? ('"' + a + '"') : a).join(' ');
  const cp = require('child_process').spawn(command, args, {
    env: options.env || process.env,
    stdio: options.stdio || 'inherit'
  });
  const p = new Promise((resolve, reject) => {
    cp.once('exit', (code, reason) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Child process exit: ${code}. Reason: ${reason}\n\n${command} ${argsString}\n`));
      }
    });
  });
  p.cp = cp;
  return p;
}

exports.spawn = spawn;
