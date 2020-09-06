import IArchive from './IArchive';

export default interface IProtection {
  apply(archive: IArchive): IArchive
}
