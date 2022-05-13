/* eslint-disable no-plusplus */
/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import path from 'path';
import Module from 'module';

// @ts-ignore
const originalResolveLookupPaths = Module._resolveLookupPaths;

function ovverride2(request: unknown, parent: unknown) {
  // @ts-ignore
  const result = originalResolveLookupPaths.call(this, request, parent);

  if (!result) return result;

  for (let i = 0; i < result.length; i++) {
    if (path.basename(result[i]) === 'node_modules') {
      result.splice(i + 1, 0, `${result[i]}.asar`);
      i++;
    }
  }

  return result;
}

function ovverride1(request: unknown, parent: unknown, newReturn: unknown) {
  const result = originalResolveLookupPaths.call(
    // @ts-ignore
    this,
    request,
    parent,
    newReturn
  );

  const paths = newReturn ? result : result[1];

  for (let i = 0; i < paths.length; i++) {
    if (path.basename(paths[i]) === 'node_modules') {
      paths.splice(i + 1, 0, `${paths[i]}.asar`);
      i++;
    }
  }

  return result;
}

// TODO: finish hooking node_modules.asar (or similar plaintext asar file w/ different name!)

/**
 * Hooks into `Module._resolveLookupPaths` so it can resolve unencrypted files from `node_modules.asar`.
 */
export function hookNodeModulesAsar() {
  // @ts-ignore
  Module._resolveLookupPaths =
    originalResolveLookupPaths.length === 2 ? ovverride2 : ovverride1;
}
