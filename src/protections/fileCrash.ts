import IArchive from '../interfaces/IArchive';
import IProtection from '../interfaces/IProtection';

const pickle = require('chromium-pickle-js');

export default class FileCrash implements IProtection {
	private target: string;

	constructor(target: string) {
		this.target = target;
	}

	apply(archive: IArchive): IArchive {

		const header = archive.header;

		if (header.files.hasOwnProperty(this.target)) {

			header.files[this.target].size = -1000;

			const headerPickle = pickle.createEmpty();
			headerPickle.writeString(JSON.stringify(header))
			const headerSize = headerPickle.toBuffer().length;

			return {
				headerSize,
				header,
				content: archive.content
			}
		}

		throw new Error(`${this.target} not found in archive!`)
	}
}

