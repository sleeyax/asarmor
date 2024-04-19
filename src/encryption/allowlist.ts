/* eslint-disable no-plusplus */
/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import path from 'path';
import Module from 'module';

// @ts-ignore
const originalResolveLookupPaths = Module._resolveLookupPaths;

/**
 * Hooks into `Module._resolveLookupPaths` so it can resolve unencrypted source files.
 * @example
 * allowUnencrypted(['node_modules']); // This will allow resolution of unencrypted code from `node_modules.asar`.
 */
export function allowUnencrypted(allowedPaths: string[]) {
  function override2args(request: unknown, parent: unknown) {
    // @ts-ignore
    const result = originalResolveLookupPaths.call(this, request, parent);

    if (!result) return result;

    for (let i = 0; i < result.length; i++) {
      if (allowedPaths.includes(path.basename(result[i]))) {
        result.splice(i + 1, 0, `${result[i]}.asar`);
        i++;
      }
    }

    return result;
  }

  function override3args(
    request: unknown,
    parent: unknown,
    newReturn: unknown
  ) {
    const result = originalResolveLookupPaths.call(
      // @ts-ignore
      this,
      request,
      parent,
      newReturn
    );

    const paths = newReturn ? result : result[1];

    for (let i = 0; i < paths.length; i++) {
      if (allowedPaths.includes(path.basename(paths[i]))) {
        paths.splice(i + 1, 0, `${paths[i]}.asar`);
        i++;
      }
    }

    return result;
  }

  // @ts-ignore
  Module._resolveLookupPaths =
    originalResolveLookupPaths.length === 2 ? override2args : override3args;
}
