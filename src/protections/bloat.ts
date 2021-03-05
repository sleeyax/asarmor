import IArchive from '../interfaces/IArchive';
import IProtection from '../interfaces/IProtection';
import {randomBytes} from 'crypto';
import { random } from '../helper';

export default class Bloat implements IProtection {
  private readonly gigabytes: number;
  
  constructor(gigabytes = 500) {
    this.gigabytes = gigabytes;
  }
  
  private genUuid(length = 30) {
    return randomBytes(length).toString('hex');
  }

  apply(archive: IArchive): IArchive {
    const header = archive.header;

    const mb = 1024 * 1024;
    const gb = mb * 1024;

    for (let i = 0; i < this.gigabytes; i++) {
      const fileName = this.genUuid();
      const size = gb + random(mb, mb * 200); // add 1 to 1.2 GB per file
      
      if (process.env.VERBOSE)
        console.log(`bloat: adding ${fileName} with size ${size}`);
      
      header.files[fileName] = {
        size,
        offset: 0,
      }
    }
    
    return {
      headerSize: archive.headerSize,
      header,
    }
  }
}
