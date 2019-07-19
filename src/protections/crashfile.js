const pickle = require('chromium-pickle-js');


class CrashFile {
    constructor(target) {
        this.target = target;
    }

    apply(headerSize, header, _) {
        if (!header.files.hasOwnProperty(this.target))
            throw new Error(`${this.target} not found in archive!`);

        header.files[this.target].size = -1000;

        // Set modified header length
        const headerPickle = pickle.createEmpty();
        headerPickle.writeString(JSON.stringify(header));
        const headerBuffer = headerPickle.toBuffer();
        headerSize = headerBuffer.length;

        return [headerSize, header, _];
    }
}


module.exports = CrashFile;
