export type TraverseObjectCallBack = (
  keyPath: string[],
  value: any,
  key: string,
  obj: any
) => void;

export function traverseObject(
  traversedObject,
  fn: TraverseObjectCallBack,
  keyPath: any[] = []
) {
  if (traversedObject === null) {
    return;
  }
  Object.entries(traversedObject).forEach(([key, value]) => {
    fn([...keyPath, key], value, key, traversedObject);
    if (typeof value === "object") {
      traverseObject(value, fn, [...keyPath, key]);
    }
  });
}
