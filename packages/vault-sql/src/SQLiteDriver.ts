import { DatabaseSync } from "node:sqlite";
import type { VaultDriver } from "@stambha/vault";
import { CREATE_INDEX_SQL, CREATE_TABLE_SQL, VAULT_TABLE } from "./sql/schema.js";

export interface SQLiteDriverOptions {
  /** File path or `:memory:` */
  path?: string;
  readonly?: boolean;
}

/**
 * SQLite driver using Node's built-in `node:sqlite` (Node 22.5+).
 */
export class SQLiteDriver implements VaultDriver {
  readonly db: DatabaseSync;
  private ready = false;

  constructor(options: SQLiteDriverOptions = {}) {
    this.db = new DatabaseSync(options.path ?? ":memory:");
    if (options.readonly) {
      // readonly opens on first access — path option only for file DBs
    }
  }

  private initSchema(): void {
    if (this.ready) return;
    this.db.exec(CREATE_TABLE_SQL);
    this.db.exec(CREATE_INDEX_SQL);
    this.ready = true;
  }

  async ensureLedger(_ledger: string): Promise<void> {
    this.initSchema();
  }

  async get(ledger: string, id: string): Promise<Record<string, unknown> | null> {
    this.initSchema();
    const row = this.db
      .prepare(`SELECT data FROM ${VAULT_TABLE} WHERE ledger = ? AND id = ?`)
      .get(ledger, id) as { data: string } | undefined;

    if (!row) return null;
    return JSON.parse(row.data) as Record<string, unknown>;
  }

  async getMany(ledger: string, ids: string[]): Promise<Map<string, Record<string, unknown>>> {
    this.initSchema();
    const result = new Map<string, Record<string, unknown>>();
    if (ids.length === 0) return result;

    const placeholders = ids.map(() => "?").join(", ");
    const rows = this.db
      .prepare(`SELECT id, data FROM ${VAULT_TABLE} WHERE ledger = ? AND id IN (${placeholders})`)
      .all(ledger, ...ids) as { id: string; data: string }[];

    for (const row of rows) {
      result.set(row.id, JSON.parse(row.data) as Record<string, unknown>);
    }
    return result;
  }

  async set(ledger: string, id: string, data: Record<string, unknown>): Promise<void> {
    this.initSchema();
    const json = JSON.stringify(data);
    this.db
      .prepare(
        `INSERT INTO ${VAULT_TABLE} (ledger, id, data, updated_at)
         VALUES (?, ?, ?, unixepoch())
         ON CONFLICT(ledger, id) DO UPDATE SET
           data = excluded.data,
           updated_at = unixepoch()`,
      )
      .run(ledger, id, json);
  }

  async delete(ledger: string, id: string): Promise<void> {
    this.initSchema();
    this.db.prepare(`DELETE FROM ${VAULT_TABLE} WHERE ledger = ? AND id = ?`).run(ledger, id);
  }

  close(): void {
    this.db.close();
  }
}
