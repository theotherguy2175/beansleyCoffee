declare module "better-sqlite3-session-store" {
  import type { Store } from "express-session";
  import type BetterSqlite3 from "better-sqlite3";

  interface SqliteStoreOptions {
    client: BetterSqlite3.Database;
    expired?: { clear: boolean; intervalMs: number };
  }

  export default function SqliteStoreFactory(
    session: typeof import("express-session")
  ): new (options: SqliteStoreOptions) => Store;
}
