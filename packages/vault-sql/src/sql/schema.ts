export const VAULT_TABLE = "stambha_vault_records";

export const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${VAULT_TABLE} (
  ledger TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (ledger, id)
);
`;

export const CREATE_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_${VAULT_TABLE}_ledger ON ${VAULT_TABLE} (ledger);
`;
