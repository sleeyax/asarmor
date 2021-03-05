import IHeader from './IHeader';

export default interface IArchive {
	headerSize: number;
	header: IHeader;
	/**
	 * @deprecated: protections should not modify archive contents!
	 */
	content?: Buffer;
}
