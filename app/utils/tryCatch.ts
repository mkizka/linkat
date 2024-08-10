export function tryCatch<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T> | T,
) {
  return async (...args: Args): Promise<T | Error> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        return error;
      }
      throw error;
    }
  };
}
