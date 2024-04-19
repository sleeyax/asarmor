#!/usr/bin/env node
import { Command, InvalidArgumentError } from '@commander-js/extra-typings';
import { open, createBloatPatch, encrypt } from '../src';
import { version } from '../package.json';

function parseNumber(value: string, isRequired: boolean) {
  if (value == null && !isRequired) {
    return;
  }

  const parsedValue = parseInt(value, 10);

  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError('Not a number.');
  }

  return parsedValue;
}

const program = new Command()
  .version(version)
  .requiredOption('-a, --archive <archive>', 'input asar file (required)')
  .requiredOption('-o, --output <output>', 'output asar file (required)')
  .option('-b, --backup', 'create backup')
  .option('-r, --restore', 'restore backup')
  .option(
    '-bl, --bloat [gigabytes]',
    'fill the drive with useless data on extraction attempt',
    (value) => parseNumber(value, false)
  )
  .option(
    '-e, --encryption',
    'encrypt the JavaScript files stored in the archive'
  )
  .addHelpText(
    'after',
    `
Examples:
  $ asarmor -a app.asar -o asarmor.asar --backup --bloat 1000
  $ asarmor -a plaintext.asar -o encrypted.asar --encryption
  `
  )
  .parse(process.argv);

const options = program.opts();

if (!options.archive || !options.output) {
  program.help();
  process.exit();
}

async function main() {
  if (options.encryption) {
    await encrypt({
      src: options.archive,
      dst: options.output,
    });
  }

  const asarmor = await open(options.archive);

  if (options.restore) {
    await asarmor.restoreBackup();
  } else if (options.output) {
    if (options.backup) await asarmor.createBackup();

    if (options.bloat)
      asarmor.patch(
        createBloatPatch(options.bloat === true ? undefined : options.bloat)
      );

    await asarmor.write(options.output);
  }
}

main();
