import { randomBytes } from 'crypto';
import { Archive } from '.';
import { FileEntries } from './asar';
import { random } from './helpers';

/**
 * Adds a bunch of random files with large sizes to the archive.
 * 
 * This patch will result in huge files being written to disk upon extraction with `asar extract`, so use at your own risk AND responsibility!
 */
export function createBloatPatch({gigabytes = 100}: {
  /**
   * Total amount of gigabytes of bloat to add.
   * 
   * Defaults to `100`.
   */
  gigabytes: number,
}) : Archive {
  const files: FileEntries = {};
 
  for (let i = 0; i < gigabytes; i++) {
    // generate unique but random string
    let filename = randomBytes(30).toString('hex');
    while (Object.keys(files).indexOf(filename) > -1)
      filename = randomBytes(30).toString('hex');

    files[filename] = {offset: 0, size: 1};
  }

  return {
    header: {
      files,
    },
    headerSize: 0
  };
}

/**
 * Adds a bunch of fake files to the archive.
 * 
 * Extraction using `asar extract` will fail as a result.
 */
export function createTrashPatch(options?: {
  /**
   * List of files to add.
   */
  filenames?: string[],

  /**
   * Optional function that modifies each filename before its written.
   * 
   * Example: (filename: string) => filename + ".txt"
   */
  beforeWrite?: (fileName: string) => string
}) : Archive {
  if (!options) options = {};
  if (!options.filenames || options?.filenames.length == 0)
    options.filenames = [
      'license',
      'production',
      'development',
      'staging',
      'secrets',
    ];
  if (!options.beforeWrite) options.beforeWrite = (f) => f;
  const {beforeWrite, filenames} = options;

  const files: FileEntries = {};

  for (const filename of filenames) {
    const fileName = beforeWrite(filename);
    const size = Math.floor(random(1, Number.MAX_VALUE / 2));
    const offset = Math.floor(Math.random() * (Math.pow(2, 32) - 1));
    files[fileName] = { size, offset };
  }

  return {
    header: {files},
    headerSize: 0
  };
}