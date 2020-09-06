import IHeader from './IHeader';

export default interface IArchive {
	headerSize: number;
	header: IHeader;
	content: Buffer;
}
