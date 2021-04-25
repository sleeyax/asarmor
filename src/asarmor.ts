import fs from 'fs';
import IArchive from './interfaces/IArchive';
import IProtection from './interfaces/IProtection';

const pickle = require('chromium-pickle-js');

export default class Asarmor {
	private readonly headerSizeOffset = 8;
	private readonly filePath: string;
	private archive: IArchive;

	constructor(filePath: string) {
		this.filePath = filePath;
		if (fs.statSync(filePath).size > 2147483648)
			console.warn('Warning: archive is larger than 2GB. This might take a while.')
		this.archive = this.readArchive(this.filePath);
	}

	private readHeaderSize(fd: number) {
		const sizeBuffer = Buffer.alloc(this.headerSizeOffset);
		if (fs.readSync(fd, sizeBuffer, 0, this.headerSizeOffset, null) !== this.headerSizeOffset) {
			throw new Error('Unable to read header size!');
		}
		const sizePickle = pickle.createFromBuffer(sizeBuffer);
		return sizePickle.createIterator().readUInt32();
	}

	private readArchive(archive: string): IArchive {
		const fd = fs.openSync(archive, 'r');

		try {
			// Read header size
			const _headerSize = this.readHeaderSize(fd);

			// Read header
			const headerBuffer = Buffer.alloc(_headerSize);
			if (fs.readSync(fd, headerBuffer, 0, _headerSize, null) !== _headerSize) {
				throw new Error('Unable to read header!');
			}
			const headerPickle = pickle.createFromBuffer(headerBuffer);
			const _header = JSON.parse(headerPickle.createIterator().readString());

			// NOTE: we skip reading the content because asar files can be quite big and protections should not modify it anyways

			// Returning archive object 
			return {
				headerSize: _headerSize,
				header: _header,
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

	async write(output: string):  Promise<string> {
		return new Promise(resolve => {
			// Convert header back to string
			const headerPickle = pickle.createEmpty();
			headerPickle.writeString(JSON.stringify(this.archive.header));

			// Read new header size
			const headerBuffer = headerPickle.toBuffer();
			const sizePickle = pickle.createEmpty();
			sizePickle.writeUInt32(headerBuffer.length);
			const sizeBuffer = sizePickle.toBuffer();

			// Write everything to output file :D
			const tmp = output + '.tmp'; // create temp file bcs we can't read & write the same file at the same time
			const writeStream = fs.createWriteStream(tmp, { flags : 'w' });
			writeStream.write(sizeBuffer);
			writeStream.write(headerBuffer);
			// write unmodified contents
			const fd = fs.openSync(this.filePath, 'r');
			const originalHeaderSize = this.readHeaderSize(fd);
			fs.closeSync(fd);
			const readStream = fs.createReadStream(this.filePath, {start: this.headerSizeOffset + originalHeaderSize});
			readStream.pipe(writeStream);
			readStream.on('close', () => readStream.unpipe());
			writeStream.on('close', () => {
				fs.renameSync(tmp, output);
				resolve(output);
			});
		});
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
