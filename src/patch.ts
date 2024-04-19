import { randomBytes } from 'crypto';
import { Archive, FileEntries } from './asar';

export type Patch = Partial<Archive>;

const CHUNK_SIZE = 1024 * 1024 * 1024;

/**
 * Upon extraction with `asar extract`, this patch will write empty zero-filled (0 bytes) files of the target size in chunks of `1 GB` to disk. Use at your own risk AND responsibility!
 *
 * Defaults to `100 GB`.
 */
export function createBloatPatch(gigabytes = 100): Patch {
  const files: FileEntries = {};

  for (let i = 0; i < gigabytes; i++) {
    // generate unique but random string
    let filename = randomBytes(30).toString('hex');
    while (Object.keys(files).indexOf(filename) > -1)
      filename = randomBytes(30).toString('hex');

    const offset = Number.MAX_SAFE_INTEGER - CHUNK_SIZE;

    files[filename] = { offset: offset.toString(), size: CHUNK_SIZE };
  }

  return {
    header: {
      files,
    },
  };
}
