import IFileOffset from './IFileOffset';

export default interface IFileEntries {
  [filename: string]: IFileOffset;
}
