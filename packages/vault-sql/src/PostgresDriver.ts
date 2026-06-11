import type { VaultDriver } from "@stambha/vault";
import pg from "pg";
import { VAULT_TABLE } from "./sql/schema.js";

const { Pool } = pg;

export interface PostgresDriverOptions {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}

/**
 * PostgreSQL driver for production Vault storage.
 */
export class PostgresDriver implements VaultDriver {
  private readonly pool: pg.Pool;
  private ready = false;

  constructor(options: PostgresDriverOptions = {}) {
    this.pool = new Pool({
      connectionString: options.connectionString,
      host: options.host,
      port: options.port,
      user: options.user,
      password: options.password,
      database: options.database,
      ssl: options.ssl,
    });
  }

  private async initSchema(): Promise<void> {
    if (this.ready) return;
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${VAULT_TABLE} (
        ledger TEXT NOT NULL,
        id TEXT NOT NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (ledger, id)
      );
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_${VAULT_TABLE}_ledger ON ${VAULT_TABLE} (ledger);
    `);
    this.ready = true;
  }

  async ensureLedger(_ledger: string): Promise<void> {
    await this.initSchema();
  }

  async get(ledger: string, id: string): Promise<Record<string, unknown> | null> {
    await this.initSchema();
    const res = await this.pool.query(
      `SELECT data FROM ${VAULT_TABLE} WHERE ledger = $1 AND id = $2`,
      [ledger, id],
    );
    if (res.rowCount === 0) return null;
    return res.rows[0].data as Record<string, unknown>;
  }

  async getMany(ledger: string, ids: string[]): Promise<Map<string, Record<string, unknown>>> {
    await this.initSchema();
    const result = new Map<string, Record<string, unknown>>();
    if (ids.length === 0) return result;

    const res = await this.pool.query(
      `SELECT id, data FROM ${VAULT_TABLE} WHERE ledger = $1 AND id = ANY($2::text[])`,
      [ledger, ids],
    );

    for (const row of res.rows) {
      result.set(row.id as string, row.data as Record<string, unknown>);
    }
    return result;
  }

  async set(ledger: string, id: string, data: Record<string, unknown>): Promise<void> {
    await this.initSchema();
    await this.pool.query(
      `INSERT INTO ${VAULT_TABLE} (ledger, id, data, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (ledger, id) DO UPDATE SET
         data = EXCLUDED.data,
         updated_at = NOW()`,
      [ledger, id, JSON.stringify(data)],
    );
  }

  async delete(ledger: string, id: string): Promise<void> {
    await this.initSchema();
    await this.pool.query(`DELETE FROM ${VAULT_TABLE} WHERE ledger = $1 AND id = $2`, [ledger, id]);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
