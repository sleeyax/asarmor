import IHeader from '../interfaces/IHeader';
import IArchive from '../interfaces/IArchive';

const pickle = require('chromium-pickle-js');

export default class FileCrash {
	private target: string;
	private headerSize: number;
	private header: IHeader;

	constructor(target: string) {
		this.target = target;
		this.headerSize = 0;
		this.header = { files: '' }
	}

	public apply(archive: IArchive): IArchive {

		this.header = archive.header;

		if (this.header.files.hasOwnProperty(this.target)) {

			this.header.files[this.target].size = -1000;

			const headerPickle = pickle.createEmpty();
			headerPickle.writeString(JSON.stringify(this.header))
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

