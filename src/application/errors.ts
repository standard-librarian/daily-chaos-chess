export class ApplicationError extends Error {}

export class AuthenticationRequiredError extends ApplicationError {}

export class AuthorizationError extends ApplicationError {}

export class ConflictError extends ApplicationError {}

export class NotFoundError extends ApplicationError {}
