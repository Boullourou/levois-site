import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
} from "@cloudflare/workers-types";

export type CockpitDatabase = D1Database;

export class DomainError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}
export function requireDatabase(database?: D1Database): D1Database {
  if (!database) throw new DomainError(503, "DB_UNAVAILABLE", "La base privée du cockpit n'est pas disponible.");
  return database;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function text(value: unknown, field: string, options: { optional?: boolean; max?: number } = {}): string | null {
  if (value == null || value === "") {
    if (options.optional) return null;
    throw new DomainError(400, "VALIDATION_ERROR", `${field} est requis.`);
  }
  if (typeof value !== "string") throw new DomainError(400, "VALIDATION_ERROR", `${field} doit être un texte.`);
  const normalized = value.trim();
  if (!normalized && !options.optional) throw new DomainError(400, "VALIDATION_ERROR", `${field} est requis.`);
  const max = options.max ?? 2_000;
  if (normalized.length > max) throw new DomainError(400, "VALIDATION_ERROR", `${field} dépasse ${max} caractères.`);
  return normalized || null;
}

export function optionalIso(value: unknown, field: string): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new DomainError(400, "VALIDATION_ERROR", `${field} doit être une date ISO valide.`);
  }
  return new Date(value).toISOString();
}

export function requiredIso(value: unknown, field: string): string {
  return optionalIso(value, field) ?? (() => { throw new DomainError(400, "VALIDATION_ERROR", `${field} est requis.`); })();
}

export function integer(value: unknown, field: string, options: { min?: number; max?: number } = {}): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new DomainError(400, "VALIDATION_ERROR", `${field} doit être un entier sûr.`);
  }
  if (options.min != null && value < options.min) throw new DomainError(400, "VALIDATION_ERROR", `${field} est trop petit.`);
  if (options.max != null && value > options.max) throw new DomainError(400, "VALIDATION_ERROR", `${field} est trop grand.`);
  return value;
}

export function expectedVersion(value: unknown): number {
  return integer(value, "expected_version", { min: 1 });
}

export function enumValue<const T extends readonly string[]>(value: unknown, allowed: T, field: string): T[number] {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new DomainError(400, "VALIDATION_ERROR", `${field} est invalide.`, { allowed });
  }
  return value as T[number];
}

export function boolean(value: unknown, field: string, defaultValue = false): boolean {
  if (value == null) return defaultValue;
  if (typeof value !== "boolean") throw new DomainError(400, "VALIDATION_ERROR", `${field} doit être booléen.`);
  return value;
}

export async function allRows<T>(statement: D1PreparedStatement): Promise<T[]> {
  const result = await statement.all<T>();
  return result.results ?? [];
}

export async function firstRow<T>(statement: D1PreparedStatement): Promise<T | null> {
  return statement.first<T>();
}

export function changed(result: D1Result<unknown> | undefined): number {
  return Number(result?.meta?.changes ?? 0);
}

export async function batch(database: D1Database, statements: D1PreparedStatement[]): Promise<D1Result<unknown>[]> {
  try {
    return await database.batch(statements);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/UNIQUE constraint failed|idempotency/i.test(message)) {
      throw new DomainError(409, "CONFLICT", "La commande existe déjà ou entre en conflit avec une modification récente.");
    }
    if (/FOREIGN KEY|CHECK constraint|trigger|requires|must|incompatible/i.test(message)) {
      throw new DomainError(400, "INVARIANT_VIOLATION", "La commande ne respecte pas les règles métier.");
    }
    throw new DomainError(503, "DB_UNAVAILABLE", "La base privée n'a pas pu traiter la commande.");
  }
}
