import IProtection from '../interfaces/IProtection';
import IArchive from '../interfaces/IArchive';
import IHeader from '../interfaces/IHeader';
import { random, randomItem } from '../helper';

const maxInt = Number.MAX_SAFE_INTEGER;

export type Randomizer = (fileName: string) => string;

export default class Trashify implements IProtection {
  private fileNames: string[];

  private randomizer: Randomizer;

  constructor(fileNames?: string[], randomizer?: (fileName: string) => string) {
    const defaultRandomizer = (fileName: string) => fileName;
    this.randomizer = randomizer || defaultRandomizer;
    this.fileNames = fileNames || [
      'license-check',
      'license',
      'production',
      'development',
      'staging',
      'passwords',
      'secrets',
      'activation',
      'authentication',
      'identity',
      'debugging'
    ];
  }

  private randomizeFileName(fileName: string) {
    return this.randomizer(fileName);
  }

  private addGarbageFiles(header: IHeader) {
    if (!header.files) return header;

    const garbageFiles: any = {};

    const garbageFilesCount = random(1, this.fileNames.length);
    for (let i = 0; i < garbageFilesCount; i++) {
      const fileName = this.randomizeFileName(randomItem(this.fileNames));
      const size = Math.floor(random(maxInt / 100, maxInt / 2));
      const offset = Math.floor(Math.random() * (Math.pow(2, 32) - 1));
      if (process.env.VERBOSE)
        console.log(`trashify: adding ${fileName} with size ${size} at offset ${offset}`);
      garbageFiles[fileName] = { size, offset };
    }

    // recursively add more garbage to files in subdirectories
    for (const [fileName, fileInfo] of Object.entries<IHeader>(header.files)) {
      garbageFiles[fileName] = this.addGarbageFiles(fileInfo);
    }

    return { files: { ...header.files, ...garbageFiles } };
  }

  apply(archive: IArchive): IArchive {

    const header = this.addGarbageFiles(archive.header);

    return {
      content: archive.content,
      headerSize: archive.headerSize,
      header
    };
  }

}

export class Randomizers {
  static junkedJsExtension: Randomizer = (fileName) => `${fileName}.${Math.random().toString(36).substr(2, 6)}.js`;
  static randomExtension: Randomizer = (fileName) => `${fileName}.${randomItem(['js', 'ts', 'jsx', 'tsx', 'txt', 'key', 'license', 'png', 'jpg', 'gif', 'md'])}`
}