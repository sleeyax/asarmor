import * as pickle from 'chromium-pickle-js';
import { IHeader } from '../interfaces/IHeader';
import { IArchive } from '../interfaces/IArchive';

class CrashFile {
	private target: string;
	private headerSize: number;
	private header: IHeader;

	constructor(target: string) {
		this.target = target;
	}

	public apply(archive: IArchive): IArchive {

		this.header = archive.header;

		if (contents.hasOwnProperty(this.target)) {

			this.header.files[this.target].size = -1000;

			const headerPickle = pickle.createEmpty();
			headerPickle.writeString(JSON.stringify(header))
			this.headerSize = headerPickle.toBuffer().length; 

			const newArchive = {
				headerSize: this.headerSize,
				header: this.header,
				contents: archive.contents
			}

			return newArchive;
		}

		throw new Error(`${this.target} not found in archive!`)

	}
}

export default CrashFile;
