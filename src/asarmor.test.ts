import { createBloatPatch, createTrashPatch, File, Header } from '.';
import Asarmor from './asarmor';

test('can patch archive', () => {
  const asarmor = new Asarmor('', {
    header: {
      files: {
        'foo.txt': { offset: '0', size: 0 },
      },
    },
    headerSize: 0,
  });

  const archive = asarmor.patch({
    header: {
      files: {
        'bar.txt': { offset: '0', size: 0 },
      },
    },
  });

  const fileNames = Object.keys(archive.header.files);

  expect(fileNames).toStrictEqual(['bar.txt', 'foo.txt']);
});

test('can apply bloat patch', () => {
  const asarmor = new Asarmor('', {
    header: {
      files: {},
    },
    headerSize: 0,
  });

  const archive = asarmor.patch(createBloatPatch(10));
  const filenames = Object.keys(archive.header.files);
  const totalSize = filenames
    .map((filename) => (archive.header.files[filename] as File).size)
    .reduce((x, y) => x + y, 0);

  expect(filenames.length).toBe(10);
  expect(totalSize).toBe(10737418240);
});

test('can apply trash patch', () => {
  const asarmor = new Asarmor('', {
    header: {
      files: {},
    },
    headerSize: 0,
  });

  const filenames = ['foo', 'bar', 'baz'];

  const archive = asarmor.patch(
    createTrashPatch({
      filenames,
      beforeWrite: (filename) => filename + '.js',
    })
  );

  const actualFilenames = Object.keys(archive.header.files);
  const invalidExtension = actualFilenames.some(
    (filename) => !filename.endsWith('.js')
  );
  const invalidName = actualFilenames.some(
    (filename) => filenames.indexOf(filename.replace('.js', '')) == -1
  );

  expect(invalidExtension).toBe(false);
  expect(invalidName).toBe(false);
});

test('can patch filenames in directories', () => {
  const asarmor = new Asarmor('', {
    header: {
      files: {},
    },
    headerSize: 0,
  });

  const archive = asarmor.patch({
    header: {
      files: {
        bar: {
          files: {
            baz: {
              offset: '0',
              size: 0,
            },
          },
        },
      },
    },
  });

  const barDirectory = archive.header.files['bar'] as Header;

  expect(Object.keys(barDirectory)).toStrictEqual(['files']);
  expect(Object.keys(barDirectory.files)).toStrictEqual(['baz']);
});
