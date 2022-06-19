export function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function randomItem(items: any[]) {
  return items[random(0, items.length - 1)];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createNestedObject(base: any, names: string[], value: any) {
  // If a value is given, remove the last name and keep it for later:
  const lastName = arguments.length === 3 ? names.pop() : false;

  // Walk the hierarchy, creating new objects where needed.
  // If the lastName was removed, then the last object is not set yet:
  for (let i = 0; i < names.length; i++) {
    base = base[names[i]] = base[names[i]] || {};
  }

  // If a value was given, set it to the last name:
  if (lastName) base = base[lastName] = value;

  // Return the last object in the hierarchy:
  return base;
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
