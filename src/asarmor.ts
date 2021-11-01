import fsAsync, { FileHandle } from 'fs/promises';
import fs from 'fs';
import { Archive } from './asar';
import { createBloatPatch, createTrashPatch } from '.';
import { Patch } from './patch';

const pickle = require('chromium-pickle-js');

const headerSizeOffset = 8;

async function readHeaderSize(handle: FileHandle) {
	const sizeBuffer = Buffer.alloc(headerSizeOffset);
	const {bytesRead} = await handle.read(sizeBuffer, 0, headerSizeOffset, null);

	if (bytesRead !== headerSizeOffset)
		throw new Error('Unable to read header size!');

	const sizePickle = pickle.createFromBuffer(sizeBuffer);

	return sizePickle.createIterator().readUInt32();
}

async function readArchive(filePath: string): Promise<Archive> {
	const handle = await fsAsync.open(filePath, 'r');

	// Read header size
	const headerSize = await readHeaderSize(handle);

	// Read header
	const headerBuffer = Buffer.alloc(headerSize);
	const {bytesRead} = await handle.read(headerBuffer, 0, headerSize, null);
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
 * Read and parse an asar archive.
 * 
 * This can take a while depending on the size of the file.
 */
async function read(filePath: string) {
	const {size: fileSize} = await fsAsync.stat(filePath);

	if (fileSize > 2147483648)
		console.warn('Warning: archive is larger than 2GB. This might take a while.');

	const archive = await readArchive(filePath);

	return archive;
}

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
	private readonly filePath: string;
	private archive: Archive;

	/**
	 * @deprecated: use the top-level asarmor.open() function to construct a new instance instead.
	 */
	constructor(archivePath: string, archive: Archive) {
		this.filePath = archivePath;
		this.archive = archive;
	}

	/**
	 * Apply a patch to the asar archive.
	 */
	patch(patch?: Patch): Archive {
		if (!patch) {
			this.patch(createTrashPatch());
			this.patch(createBloatPatch());
			return this.archive;
		}

		if (patch.header)
			this.archive.header.files = {...patch.header.files, ...this.archive.header.files};

		if (!patch.headerSize && patch.header) {
			const headerPickle = pickle.createEmpty();
			headerPickle.writeString(JSON.stringify(this.archive.header))
			this.archive.headerSize = headerPickle.toBuffer().length;
		} else if (patch.headerSize) {
			this.archive.headerSize = patch.headerSize;
		}

		return this.archive;
	}

	/**
	 * Write modified asar archive to given absolute file path.
	 */
	async write(outputPath: string): Promise<string> {
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
		const originalHeaderSize = await readHeaderSize(fd);
		await fd.close();
		const readStream = fs.createReadStream(this.filePath, {start: headerSizeOffset + originalHeaderSize});
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

	async createBackup(options?: CreateBackupOptions) {
		const backupPath = options?.backupPath || this.filePath + '.bak';

		if (!fs.existsSync(backupPath) || options?.overwrite)
			await fsAsync.copyFile(this.filePath, backupPath);
	}

	async restoreBackup(options?: RestoreBackupOptions) {
		const backupPath = options?.backupPath || this.filePath + '.bak';

		if (fs.existsSync(backupPath)) {
			await fsAsync.copyFile(backupPath, this.filePath);
			if (options?.remove) await fsAsync.unlink(backupPath);
		}
	}
}

/**
 * Open and prepare asar archive file for modifications.
 */
export async function open(asarFilePath: string) {
	const archive = await read(asarFilePath);
	return new Asarmor(asarFilePath, archive);
}

/**
 * Alias of `asarmor.write()`.
 */
export async function close(asarmor: Asarmor, outputfilePath: string) {
	return asarmor.write(outputfilePath);
}
