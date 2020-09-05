"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var index_1 = require("../src/tsVersion/index");
var program = new commander_1.Command();
program
    .option('-a, --archive <archive>', 'input asar file (required)')
    .option('-o, --output <output>', 'output asar file (required)')
    .option('-f, --filetocrash <filename>', 'stop extraction by corrupting specified file within the archive')
    .parse(process.argv);
if ((program === null || program === void 0 ? void 0 : program.archive) && (program === null || program === void 0 ? void 0 : program.output)) {
    var asarmor = new index_1.Asarmor(program === null || program === void 0 ? void 0 : program.archive);
    if (program.filetocrash) {
        asarmor.applyProtection(new index_1.FileCrash(program.filetocrash));
    }
    asarmor.write(program.output);
}
else {
    program.help();
    program.exit();
}
