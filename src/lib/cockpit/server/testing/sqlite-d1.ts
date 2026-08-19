import { DatabaseSync, type StatementSync } from "node:sqlite";
import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";

type Bound = string | number | null;

class SqliteStatement {
  constructor(
    private readonly owner: SqliteD1,
    readonly sql: string,
    readonly values: Bound[] = [],
  ) {}

  bind(...values: unknown[]): SqliteStatement {
    return new SqliteStatement(this.owner, this.sql, values.map((value) => value == null ? null : value as Bound));
  }

  private statement(): StatementSync {
    return this.owner.raw.prepare(this.sql);
  }

  async all<T>() {
    const results = this.statement().all(...this.values) as T[];
    return { results, success: true, meta: { changes: 0 } };
  }

  async first<T>(column?: string): Promise<T | null> {
    const row = this.statement().get(...this.values) as Record<string, unknown> | undefined;
    if (!row) return null;
    return (column ? row[column] : row) as T;
  }

  async run() {
    const result = this.statement().run(...this.values);
    return { success: true, results: [], meta: { changes: Number(result.changes), last_row_id: result.lastInsertRowid } };
  }

  async raw<T>(): Promise<T[]> {
    return this.statement().all(...this.values).map((row) => Object.values(row as Record<string, unknown>)) as T[];
  }
}

export class SqliteD1 {
  readonly raw = new DatabaseSync(":memory:");
  readonly preparedSql: string[] = [];

  constructor() {
    this.raw.exec("PRAGMA foreign_keys = ON;");
  }

  prepare(sql: string): SqliteStatement {
    this.preparedSql.push(sql);
    return new SqliteStatement(this, sql);
  }

  clearPreparedSql(): void {
    this.preparedSql.length = 0;
  }

  async batch(statements: D1PreparedStatement[]) {
    this.raw.exec("BEGIN IMMEDIATE;");
    try {
      const results = [];
      for (const statement of statements as unknown as SqliteStatement[]) {
        const leading = statement.sql.trimStart().slice(0, 12).toUpperCase();
        results.push(leading.startsWith("SELECT") || leading.startsWith("PRAGMA") || leading.startsWith("WITH")
          ? await statement.all()
          : await statement.run());
      }
      this.raw.exec("COMMIT;");
      return results;
    } catch (error) {
      this.raw.exec("ROLLBACK;");
      throw error;
    }
  }

  async exec(sql: string) {
    this.raw.exec(sql);
    return { count: 1, duration: 0 };
  }

  dump(): Promise<ArrayBuffer> {
    throw new Error("dump is not needed in tests");
  }

  asD1(): D1Database {
    return this as unknown as D1Database;
  }

  close(): void {
    this.raw.close();
  }
}
