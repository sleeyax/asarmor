"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var pickle = require('chromium-pickle-js');
var Asarmor = /** @class */ (function () {
    function Asarmor(filePath) {
        this.filePath = filePath;
        this.archive = this.readArchive(this.filePath);
    }
    Asarmor.prototype.readArchiveContents = function (header, headerSize) {
        for (var key in header) {
            var file = header[key];
            var contentArr = [];
            // Call recursively for directories :D
            if (file === null || file === void 0 ? void 0 : file.files) {
                contentArr.push(this.readArchiveContents(file.files, headerSize));
            }
            else {
                var fd = fs.openSync(this.filePath, 'r');
                var buffer = Buffer.alloc(file.size);
                var offset = 8 + headerSize + parseInt(file.offset);
                fs.readSync(fd, buffer, 0, file.size, offset);
                contentArr.push(buffer);
                return contentArr;
            }
        }
    };
    Asarmor.prototype.readArchive = function (archive) {
        var fd = fs.openSync(archive, 'r');
        try {
            // Read header size
            var sizeBuffer = Buffer.alloc(8);
            if (fs.readSync(fd, sizeBuffer, 0, 8, null) !== 8) {
                throw new Error('Unable to read header size!');
            }
            var sizePickle = pickle.createFromBuffer(sizeBuffer);
            var _headerSize = sizePickle.createIterator().readUInt32();
            // Read header
            var headerBuffer = Buffer.alloc(_headerSize);
            if (fs.readSync(fd, headerBuffer, 0, _headerSize, null) !== _headerSize) {
                throw new Error('Unable to read header!');
            }
            var headerPickle = pickle.createFromBuffer(headerBuffer);
            var _header = JSON.parse(headerPickle.createIterator().readString());
            // Read files stored in archive to a Buffer[] array
            var _contents = this.readArchiveContents(_header.files, _headerSize);
            // Returning archive object 
            return {
                headerSize: _headerSize,
                header: _header,
                contents: _contents
            };
        }
        catch (e) {
            throw new Error(e.message);
        }
        finally {
            fs.closeSync(fd);
        }
    };
    Asarmor.prototype.applyProtection = function (protection) {
        return protection.apply(this.archive);
    };
    Asarmor.prototype.write = function (output) {
        // Convert header back to string
        var headerPickle = pickle.createEmpty();
        headerPickle.writeString(JSON.stringify(this.archive.header));
        // Read new header size
        var headerBuffer = headerPickle.toBuffer();
        var sizePickle = pickle.createEmpty();
        sizePickle.writeUInt32(headerBuffer.length);
        var sizeBuffer = sizePickle.toBuffer();
        // Write everything to output file :D
        var out = fs.createWriteStream(output);
        out.write(sizeBuffer);
        out.write(headerBuffer);
        this.archive.contents.forEach(function (buffer) {
            out.write(buffer);
        });
        out.end();
    };
    return Asarmor;
}());
exports.default = Asarmor;
