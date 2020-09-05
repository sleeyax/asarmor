import * as fs from 'fs';
import IArchive from './interfaces/IArchive';
import IHeader from './interfaces/IHeader';
import FileCrash from './protections/fileCrash';

const pickle = require('chromium-pickle-js');

export default class Asarmor {
	private filePath: string;
	private archive: IArchive;

	constructor(filePath: string) {
		this.filePath = filePath;
		this.archive = this.readArchive(this.filePath);
	}

	private readArchiveContents(header: IHeader, headerSize: number) {
		for (let key in header) {
			const file = header[key];
			let contentArr = [];
			// Call recursively for directories :D
			if (file?.files) {
				contentArr.push(this.readArchiveContents(file.files, headerSize));
			} else {
				const fd = fs.openSync(this.filePath, 'r');
				const buffer = Buffer.alloc(file.size);
				const offset = 8 + headerSize + parseInt(file.offset);
				fs.readSync(fd, buffer, 0, file.size, offset);

				contentArr.push(buffer);
				return contentArr;

			}
		}
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

			// Read files stored in archive to a Buffer[] array
			const _contents = this.readArchiveContents(_header.files, _headerSize);

			// Returning archive object 
			return {
				headerSize: _headerSize,
				header: _header,
				contents: _contents
			}
		} catch(e) {
			throw new Error(e.message);
		} finally {
			fs.closeSync(fd);
		}
	}

	public applyProtection(protection: FileCrash) {
		return protection.apply(this.archive)
	}

	public write(output: string) {
		// Convert header back to string
		const headerPickle = pickle.createEmpty();
		headerPickle.writeString(JSON.stringify(this.archive.header));

		// Read new header size
		const headerBuffer = headerPickle.toBuffer();
		const sizePickle = pickle.createEmpty();
		sizePickle.writeUInt32(headerBuffer.length);
		const sizeBuffer = sizePickle.toBuffer();

		// Write everything to output file :D
		const out = fs.createWriteStream(output);
		out.write(sizeBuffer);
		out.write(headerBuffer);

		this.archive.contents?.forEach( (buffer: Buffer) => {
			out.write(buffer);
		});

		out.end();
	}
}
