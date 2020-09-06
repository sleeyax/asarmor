import fs from 'fs';
import IArchive from './interfaces/IArchive';
import IProtection from './interfaces/IProtection';

const pickle = require('chromium-pickle-js');

export default class Asarmor {
	private filePath: string;
	private archive: IArchive;

	constructor(filePath: string) {
		this.filePath = filePath;
		this.archive = this.readArchive(this.filePath);
	}

	private readArchiveContents(headerSize: number) {
		const fileBuf = fs.readFileSync(this.filePath);
		const start = 8 + headerSize;
		return fileBuf.slice(start);
	}

	private readArchive(archive: string): IArchive {
		const fd = fs.openSync(archive, 'r');

		try {
			// Read header size
			const sizeBuffer = Buffer.alloc(8);
			if (fs.readSync(fd, sizeBuffer, 0, 8, null) !== 8) {
				throw new Error('Unable to read header size!');
			}
			const sizePickle = pickle.createFromBuffer(sizeBuffer);
			const _headerSize = sizePickle.createIterator().readUInt32();

			// Read header
			const headerBuffer = Buffer.alloc(_headerSize);
			if (fs.readSync(fd, headerBuffer, 0, _headerSize, null) !== _headerSize) {
				throw new Error('Unable to read header!');
			}
			const headerPickle = pickle.createFromBuffer(headerBuffer);
			const _header = JSON.parse(headerPickle.createIterator().readString());

			// Read files stored in archive to Buffer
			const _content = this.readArchiveContents(_headerSize);

			// Returning archive object 
			return {
				headerSize: _headerSize,
				header: _header,
				content: _content
			}
		} catch(e) {
			throw e;
		} finally {
			fs.closeSync(fd);
		}
	}

	applyProtection(protection: IProtection) {
		this.archive = protection.apply(this.archive);
	}

	write(output: string) {
		// Convert header back to string
		const headerPickle = pickle.createEmpty();
		headerPickle.writeString(JSON.stringify(this.archive.header));

		// Read new header size
		const headerBuffer = headerPickle.toBuffer();
		const sizePickle = pickle.createEmpty();
		sizePickle.writeUInt32(headerBuffer.length);
		const sizeBuffer = sizePickle.toBuffer();

		// Write everything to output file :D
		fs.writeFileSync(output, Buffer.concat([sizeBuffer, headerBuffer, this.archive.content]));
	}

	createBackup(backupPath?: string, force = false) {
		backupPath = backupPath || this.filePath + '.bak';
		if (!fs.existsSync(backupPath) || force)
			fs.copyFileSync(this.filePath, backupPath);
	}

	restoreBackup(backupPath?: string, remove = true) {
		backupPath = backupPath || this.filePath + '.bak';
		if (fs.existsSync(backupPath)) {
			fs.copyFileSync(backupPath, this.filePath);
			if (remove) fs.unlinkSync(backupPath);
		}
	}
}
