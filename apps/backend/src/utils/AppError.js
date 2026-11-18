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
