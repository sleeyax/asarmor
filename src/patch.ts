import { randomBytes } from 'crypto';
import { Archive, FileEntries } from './asar';

export type Patch = Partial<Archive>;

/**
 * Adds a bunch of random files with large sizes to the archive.
 *
 * This patch will result in huge files being written to disk upon extraction with `asar extract`, so use at your own risk AND responsibility!
 *
 * Defaults to `100 GB` of bloat.
 */
export function createBloatPatch(gigabytes = 10): Patch {
  const files: FileEntries = {};

  for (let i = 0; i < gigabytes; i++) {
    // generate unique but random string
    let filename = randomBytes(30).toString('hex');
    while (Object.keys(files).indexOf(filename) > -1)
      filename = randomBytes(30).toString('hex');

    files[filename] = { offset: '0', size: 1 * 1024 * 1024 * 1024 };
  }

  return {
    header: {
      files,
    },
  };
}
