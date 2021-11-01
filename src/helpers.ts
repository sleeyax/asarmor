export function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function randomItem(items: any[]) {
  return items[random(0, items.length - 1)];
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
