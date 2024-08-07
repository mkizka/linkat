export const required = <T>(value: T): NonNullable<T> => {
  if (value === null || value === undefined) {
    throw new Error("requiredによってエラーが発生しました。");
  }
  return value;
};
