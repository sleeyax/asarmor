import { Command } from 'commander';
import { Asarmor, FileCrash } from '../src';

const program = new Command();

program
	.option('-a, --archive <archive>', 'input asar file (required)')
	.option('-o, --output <output>', 'output asar file (required)')
	.option('-f, --filetocrash <filename>', 'stop extraction by corrupting specified file within the archive')
	.parse(process.argv);

if (program?.archive && program?.output) {
	const asarmor = new Asarmor(program?.archive);

	if (program.filetocrash) {
		asarmor.applyProtection(new FileCrash(program.filetocrash));
	}
	asarmor.write(program.output);
} else {
	program.help();
	program.exit();
}
