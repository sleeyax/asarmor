const pickle = require('chromium-pickle-js');
const fs = require('fs');

class Asarmor {
    constructor(filePath) {
        this.filePath = filePath;
        this.archive = {};
        this._readArchive(filePath);
    }

    _readArchiveContents(header) {
        for (let key in header) {
            const file = header[key];
            // Call recursively if this is a directory
            if (file.hasOwnProperty('files')) {
                this._readArchiveContents(file.files);
            } else {
                // Read file to Buffer and store it in an array
                const fd = fs.openSync(this.filePath, 'r');
                const buffer = Buffer.alloc(file.size);
                const offset = 8 + this.archive.headerSize + parseInt(file.offset);
                fs.readSync(fd, buffer, 0, file.size, offset);
                if (this.archive.contents === undefined) this.archive.contents = [];
                this.archive.contents.push(buffer);
            }
        }
    }

    _readArchive(archive) {
        const fd = fs.openSync(archive, 'r');
        try {
            // Read header size
            const sizeBuffer = Buffer.alloc(8);
            if (fs.readSync(fd, sizeBuffer, 0, 8, null) !== 8) {
                throw new Error('Unable to read header size')
            }
            const sizePickle = pickle.createFromBuffer(sizeBuffer);
            this.archive.headerSize = sizePickle.createIterator().readUInt32();

            // Read header
            const headerBuffer = Buffer.alloc(this.archive.headerSize);
            if (fs.readSync(fd, headerBuffer, 0, this.archive.headerSize, null) !== this.archive.headerSize) {
                throw new Error('Unable to read header');
            }
            const headerPickle = pickle.createFromBuffer(headerBuffer);
            this.archive.header = JSON.parse(headerPickle.createIterator().readString());

            // Read files stored in the archive to a Buffer[] array
            this._readArchiveContents(this.archive.header.files);

        }finally {
            fs.closeSync(fd);
        }
    }

    applyProtection(protection) {
        [
            this.archive.headerSize,
            this.archive.header,
            this.archive.contents
        ] = protection.apply(this.archive.headerSize, this.archive.header, this.archive.contents);
    }

    write(output) {
        // Convert header back to string
        const headerPickle = pickle.createEmpty();
        headerPickle.writeString(JSON.stringify(this.archive.header));
        const headerBuffer = headerPickle.toBuffer();

        // Read new header size
        const sizePickle = pickle.createEmpty();
        sizePickle.writeUInt32(headerBuffer.length);
        const sizeBuffer = sizePickle.toBuffer();

        // Write everything back to output file
        const out = fs.createWriteStream(output);
        out.write(sizeBuffer);
        out.write(headerBuffer);
        this.archive.contents.forEach(buffer => {
            out.write(buffer);
        });
        out.end();
    }
}

module.exports = Asarmor;
