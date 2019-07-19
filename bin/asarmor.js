const program = require('commander');
const Asarmor = require('../src/asarmor');

program
    .option('-a, --archive <archive>', 'input asar file (required)')
    .option('-o, --output <output>', 'output asar file (required)')
    .option('--filecrash <filename>', 'crash extraction by corrupting specified file within the archive')
    .parse(process.argv);

if (program.archive === undefined || program.output === undefined) {
    program.help();
    process.exit();
}

const asarmor = new Asarmor(program.archive);

if (program.filecrash) {
    const FileCrash = require('../src/protections/crashfile');
    asarmor.applyProtection(new FileCrash(program.filecrash));
}

asarmor.write(program.output);
