# @stambha/vault-sql

**SQL drivers for Stambha Vault** — SQLite (Node 22.5+ built-in) and PostgreSQL backends.

Part of the [**@stambha**](https://www.npmjs.com/org/stambha) monorepo · [GitHub](https://github.com/Mivaya/Stambha-plugins)

---

## Install

```bash
npm install @stambha/vault-sql @stambha/vault
```

Requires **Node.js 22.5+** (for `node:sqlite`).

---

## Quick start

### SQLite

```ts
import { Vault } from "@stambha/vault";
import { SQLiteDriver } from "@stambha/vault-sql";
import { GuildBlueprint } from "./schemas/GuildBlueprint.js";

const vault = new Vault({ driver: new SQLiteDriver({ path: "./data/vault.sqlite" }) });
vault.registerLedger("guild", { blueprint: GuildBlueprint });
await vault.init();
```

### PostgreSQL

```ts
import { PostgresDriver } from "@stambha/vault-sql";

const vault = new Vault({
  driver: new PostgresDriver({
    connectionString: process.env.DATABASE_URL!,
  }),
});
vault.registerLedger("guild", { blueprint: GuildBlueprint });
await vault.init();
```

Drivers create the vault table automatically on `init()`.

---

## Key exports

| Export | Purpose |
|--------|---------|
| `SQLiteDriver` | File-backed SQLite storage |
| `PostgresDriver` | PostgreSQL storage |
| `VAULT_TABLE` | Shared table name constant |

---

## Related packages

| Package | Role |
|---------|------|
| [`@stambha/vault`](../vault) | Blueprints, Ledger, Record API |
| [`@stambha/core`](../core) | Use settings in commands |

---

## Development

```bash
pnpm --filter @stambha/vault-sql build
pnpm --filter @stambha/vault-sql test
```
