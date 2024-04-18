#!/usr/bin/env node
import { Command } from 'commander';
import { open, createBloatPatch, encrypt } from '../src';
import { version } from '../package.json';

const program = new Command();

program
  .version(version)
  .option('-a, --archive <archive>', 'input asar file (required)')
  .option('-o, --output <output>', 'output asar file (required)')
  .option('-b, --backup', 'create backup')
  .option('-r, --restore', 'restore backup')
  .option(
    '-bl, --bloat [gigabytes]',
    'add huge random files to disk on extraction attempt'
  )
  .option('-e, --encrypt <src>', 'encrypt file contents')
  .option('-k, --key <file path>', 'key file to use for encryption')
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ asarmor -a app.asar -o asarmor.asar --bloat 1000');
    console.log(
      '  $ asarmor -a app.asar -o asarmor.asar --trashify bee-movie.txt foo.js bar.ts'
    );
    console.log('  $ asarmor -a app.asar -o asarmor.asar --trashify --backup');
    console.log('  $ asarmor -a app.asar --restore');
  })
  .parse(process.argv);

if (!program.archive || !program.output) {
  program.help();
  program.exit();
}

async function main() {
  if (program.encrypt) {
    if (!program.key) {
      program.help();
      program.exit();
    }

    await encrypt({
      src: program.encrypt,
      dst: program.archive,
      keyFilePath: program.key,
    });
  }

  const asarmor = await open(program.archive);

  if (program.restore) {
    await asarmor.restoreBackup();
  } else if (program.output) {
    if (program.backup) await asarmor.createBackup();

    if (program.bloat)
      asarmor.patch(
        createBloatPatch(program.bloat === true ? undefined : program.bloat)
      );

    await asarmor.write(program.output);
  }
}

main();
