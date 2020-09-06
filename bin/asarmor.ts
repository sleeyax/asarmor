#!/usr/bin/env node
import { Command } from 'commander';
import { Asarmor, FileCrash } from '../src';
import Trashify from '../src/protections/trashify';
const { version } = require('../package.json');

const program = new Command();

program
	.version(version)
	.option('-a, --archive <archive>', 'input asar file (required)')
	.option('-o, --output <output>', 'output asar file (required)')
	.option('-v, --verbose', 'enable verbose console output')
	.option('-b, --backup', 'create backup')
	.option('-r, --restore', 'restore backup (protections won\'t be applied)')
	.option('-f, --filetocrash <filename>', 'corrupt specified file within the archive')
	.option('-t, --trashify [junkfiles...]', 'add non-existing junk files to the archive')
	.on('--help', () => {
		console.log('');
		console.log('Examples:');
		console.log('  $ asarmor -a app.asar -o asarmor.asar --filetocrash index_dummy.js');
		console.log('  $ asarmor -a app.asar -o asarmor.asar --trashify bee-movie.txt foo.js bar.ts');
		console.log('  $ asarmor -a app.asar -o asarmor.asar --trashify --backup');
		console.log('  $ asarmor -a app.asar -o asarmor.asar --trashify --restore');
	})
	.parse(process.argv);

if (program?.archive && program?.output) {
	if (program.verbose) process.env.VERBOSE = 'true';

	const asarmor = new Asarmor(program?.archive);

	if (program.restore) {
		asarmor.restoreBackup();
	}
	else {
		if (program.backup)
			asarmor.createBackup();

		if (program.filetocrash)
			asarmor.applyProtection(new FileCrash(program.filetocrash));
		if (program.trashify)
			asarmor.applyProtection(new Trashify(program.trashify === true ? undefined : program.trashify));

		asarmor.write(program.output);
	}
} else {
	program.help();
	program.exit();
}
