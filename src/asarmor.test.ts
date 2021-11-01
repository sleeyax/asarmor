import { createBloatPatch, createTrashPatch } from '.';
import Asarmor from './asarmor';

test('can patch archive', () => {
  const asarmor = new Asarmor({
    header: {
      files: {
        'foo.txt': {offset: 0, size: 0}
      }
    },
    headerSize: 0
  });

  let archive = asarmor.patch({
    header: {
      files: {
        'bar.txt': {offset: 0, size: 0}
      },
    },
    headerSize: 0
  });

  const fileNames = Object.keys(archive.header.files);

  expect(fileNames).toStrictEqual(['bar.txt', 'foo.txt']);
});

test('can apply bloat patch', () => {
  const asarmor = new Asarmor({
    header: {
      files: {}
    },
    headerSize: 0
  });

  const archive = asarmor.patch(createBloatPatch({gigabytes: 10}));
  const filenames = Object.keys(archive.header.files);

  expect(filenames.length).toBe(10);
});

test('can apply trash patch', () => {
  const asarmor = new Asarmor({
    header: {
      files: {}
    },
    headerSize: 0
  });

  const filenames = [
    'foo',
    'bar',
    'baz'
  ];

  const archive = asarmor.patch(createTrashPatch({
    filenames,
    beforeWrite: (filename) => filename + '.js'
  }));

  const actualFilenames = Object.keys(archive.header.files);
  const invalidExtension = actualFilenames.some(filename => !filename.endsWith('.js'));
  const invalidName = actualFilenames.some(filename => filenames.indexOf(filename.replace('.js', '')) == -1)

  expect(invalidExtension).toBe(false);
  expect(invalidName).toBe(false);
});
