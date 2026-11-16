// Codigo de error de Firestore cuando create() encuentra que el documento ya existe.
const ALREADY_EXISTS = 6;

export function isAlreadyExists(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "code" in error && error.code === ALREADY_EXISTS
  );
}
