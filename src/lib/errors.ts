export const getErrorMessage = (err: unknown, fallback = "Error desconocido") => {
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
};
