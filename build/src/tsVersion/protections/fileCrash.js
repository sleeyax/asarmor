"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pickle = require('chromium-pickle-js');
var FileCrash = /** @class */ (function () {
    function FileCrash(target) {
        this.target = target;
        this.headerSize = 0;
        this.header = { files: '' };
    }
    FileCrash.prototype.apply = function (archive) {
        this.header = archive.header;
        if (this.header.files.hasOwnProperty(this.target)) {
            this.header.files[this.target].size = -1000;
            var headerPickle = pickle.createEmpty();
            headerPickle.writeString(JSON.stringify(this.header));
            this.headerSize = headerPickle.toBuffer().length;
            var newArchive = {
                headerSize: this.headerSize,
                header: this.header,
                contents: archive.contents
            };
            return newArchive;
        }
        throw new Error(this.target + " not found in archive!");
    };
    return FileCrash;
}());
exports.default = FileCrash;
