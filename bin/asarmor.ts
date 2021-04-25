#!/usr/bin/env node
import { Command } from 'commander';
import { Asarmor, FileCrash } from '../src';
import Trashify from '../src/protections/trashify';
import Bloat from '../src/protections/bloat';
const { version } = require('../package.json');

const program = new Command();

program
	.version(version)
	.option('-a, --archive <archive>', 'input asar file (required)')
	.option('-o, --output <output>', 'output asar file (required)')
	.option('-v, --verbose', 'enable verbose console output')
	.option('-b, --backup', 'create backup')
	.option('-r, --restore', 'restore backup (protections won\'t be applied)')
	.option('-f, --filetocrash <filename size...>', 'corrupt specified file within the archive')
	.option('-bl, --bloat [gigabytes]', 'clogs up the hard drive on extraction by adding huge random files to the archive')
	.option('-t, --trashify [junkfiles...]', 'add non-existing junk files to the archive')
	.on('--help', () => {
		console.log('');
		console.log('Examples:');
		console.log('  $ asarmor -a app.asar -o asarmor.asar --filetocrash index_dummy.js');
		console.log('  $ asarmor -a app.asar -o asarmor.asar --filetocrash index_dummy.js -999');
		console.log('  $ asarmor -a app.asar -o asarmor.asar --bloat 1000');
		console.log('  $ asarmor -a app.asar -o asarmor.asar --trashify bee-movie.txt foo.js bar.ts');
		console.log('  $ asarmor -a app.asar -o asarmor.asar --trashify --backup');
		console.log('  $ asarmor -a app.asar --restore');
	})
	.parse(process.argv);

if (!program.archive || !program.output) {
	program.help();
	program.exit();
}

if (program.verbose) process.env.VERBOSE = 'true';

const asarmor = new Asarmor(program.archive);

if (program.restore) {
	asarmor.restoreBackup();
}
else if (program.output) {
	if (program.backup)
		asarmor.createBackup();

	if (program.filetocrash)
		asarmor.applyProtection(new FileCrash(program.filetocrash[0], +program.filetocrash[1]));
	if (program.trashify)
		asarmor.applyProtection(new Trashify(program.trashify === true ? undefined : program.trashify));
	if (program.bloat)
		asarmor.applyProtection(new Bloat(program.bloat === true ? undefined : program.bloat));

	asarmor.write(program.output).catch(console.error);
}
