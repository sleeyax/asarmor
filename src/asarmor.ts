import fsAsync, { FileHandle } from 'fs/promises';
import fs from 'fs';
import { Archive } from './asar';
import { arch } from 'os';

const pickle = require('chromium-pickle-js');

type BackupOptions = {
	/**
	 * Absolute path to the asar archive file to backup.
	 */
	backupPath?: string;
}

type CreateBackupOptions = BackupOptions & {
	/**
	 * Overwrite existing backup.
	 * 
	 * Defaults to `false`.
	 */ 
	overwrite?: boolean
}

type RestoreBackupOptions = BackupOptions & {
	/**
	 * Whether or not to remove the backup after restoration is complete.
	 * 
	 * Defaults to `true`.
	 */
	remove?: boolean;
}

export default class Asarmor {
	private readonly headerSizeOffset = 8;
	private readonly filePath: string;
	private archive?: Archive;

	constructor(archive: string | Archive) {
		if (typeof arch == 'string') {
			this.filePath = archive as any;
		} else {
			this.filePath = '';
			this.archive = archive as any;
		}
	}

	private async readHeaderSize(handle: FileHandle) {
		const sizeBuffer = Buffer.alloc(this.headerSizeOffset);
		const {bytesRead} = await fsAsync.read(handle, sizeBuffer, 0, this.headerSizeOffset, null);

		if (bytesRead !== this.headerSizeOffset)
			throw new Error('Unable to read header size!');

		const sizePickle = pickle.createFromBuffer(sizeBuffer);

		return sizePickle.createIterator().readUInt32();
	}

	private async readArchive(filePath: string): Promise<Archive> {
		const handle = await fsAsync.open(filePath, 'r');

		// Read header size
		const headerSize = await this.readHeaderSize(handle);

		// Read header
		const headerBuffer = Buffer.alloc(headerSize);
		const {bytesRead} = await fsAsync.read(handle, headerBuffer, 0, headerSize, null);
		await handle.close();

		if (bytesRead !== headerSize)
			throw new Error('Unable to read header!');
		
		const headerPickle = pickle.createFromBuffer(headerBuffer);
		const header = JSON.parse(headerPickle.createIterator().readString());

		// Returning archive object 
		return {
			headerSize,
			header,
		}
	}

	/**
	 * Reads an asar archive from given absolute path.
	 * 
	 * This can take a while depending on the size of the file. 
	 */
	async read(archivePath: string) {
		const {size: fileSize} = await fsAsync.stat(archivePath);

		if (fileSize > 2147483648)
			console.warn('Warning: archive is larger than 2GB. This might take a while.');

		this.archive = await this.readArchive(archivePath);
		return this.archive;
	}

	/**
	 * Apply a patch to the asar archive.
	 */
	patch(patch: Archive) {
		if (!this.archive) throw new Error('Archive not read yet! Call read() before using this method.');

		this.archive.header.files = {...patch.header.files, ...this.archive.header.files};

		if (patch.headerSize === 0) {
			const headerPickle = pickle.createEmpty();
			headerPickle.writeString(JSON.stringify(this.archive.header))
			this.archive.headerSize = headerPickle.toBuffer().length;
		} else {
			this.archive.headerSize = patch.headerSize;
		}

		return this.archive;
	}

	/**
	 * Write modified asar archive to given absolute file path.
	 */
	async write(outputPath: string): Promise<string> {
		if (!this.archive) throw new Error('Archive not read yet! Call read() before using this method.');

		// Convert header back to string
		const headerPickle = pickle.createEmpty();
		headerPickle.writeString(JSON.stringify(this.archive.header));

		// Read new header size
		const headerBuffer = headerPickle.toBuffer();
		const sizePickle = pickle.createEmpty();
		sizePickle.writeUInt32(headerBuffer.length);
		const sizeBuffer = sizePickle.toBuffer();

		// Write everything to output file :D
		const tmp = outputPath + '.tmp'; // create temp file bcs we can't read & write the same file at the same time
		const writeStream = fs.createWriteStream(tmp, { flags : 'w' });
		writeStream.write(sizeBuffer);
		writeStream.write(headerBuffer);

		// write unmodified contents
		const fd = await fsAsync.open(this.filePath, 'r');
		const originalHeaderSize = await this.readHeaderSize(fd);
		await fd.close();
		const readStream = fs.createReadStream(this.filePath, {start: this.headerSizeOffset + originalHeaderSize});
		readStream.pipe(writeStream);
		readStream.on('close', () => readStream.unpipe());

		return new Promise((resolve, reject) => {
			writeStream.on('close', () => {
				fs.renameSync(tmp, outputPath);
				resolve(outputPath);
			});
			writeStream.on('error', reject);
		});	
	}

	async createBackup({backupPath, overwrite = false}: CreateBackupOptions) {
		backupPath = backupPath || this.filePath + '.bak';

		if (!fs.existsSync(backupPath) || overwrite)
			await fsAsync.copyFile(this.filePath, backupPath);
	}

	async restoreBackup({backupPath, remove = true}: RestoreBackupOptions) {
		backupPath = backupPath || this.filePath + '.bak';

		if (fs.existsSync(backupPath)) {
			await fsAsync.copyFile(backupPath, this.filePath);
			if (remove) await fsAsync.unlink(backupPath);
		}
	}
}
