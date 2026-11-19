/** Error de negocio con código HTTP asociado. */
export class AppError extends Error {
  constructor(message, status = 400, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }
}

export const notFound = (entity) => new AppError(`${entity} no encontrado`, 404);

/** 409 cuando otra persona guardó cambios en el registro después de que se abrió (D-19). */
export const registroDesactualizado = (entity) =>
  new AppError(`Alguien más modificó este ${entity} mientras lo editabas. Vuelve a abrirlo para ver los datos actuales.`, 409);
