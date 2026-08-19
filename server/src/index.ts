import path from "node:path";
import fs from "node:fs";
import express from "express";
import session from "express-session";
import SqliteStoreFactory from "better-sqlite3-session-store";
import Database from "better-sqlite3";
import { env, cookieSecure } from "./env.js";
import { runMigrations } from "./db/client.js";
import { bootstrapAdmin } from "./lib/bootstrapAdmin.js";
import { seedMenuIfEmpty } from "./lib/seedMenu.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

runMigrations();
await bootstrapAdmin();
await seedMenuIfEmpty();

const app = express();
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SqliteStore = SqliteStoreFactory(session);
fs.mkdirSync(path.dirname(env.SESSIONS_DB_PATH), { recursive: true });
const sessionDb = new Database(env.SESSIONS_DB_PATH);

app.use(
  session({
    store: new SqliteStore({ client: sessionDb, expired: { clear: true, intervalMs: 15 * 60 * 1000 } }),
    secret: env.SESSION_SECRET,
    name: "connect.sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use("/uploads", express.static(env.UPLOADS_DIR));
app.use("/api", apiRouter);

const clientDist = path.join(import.meta.dirname, "../public");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`beansleyCoffee server listening on :${env.PORT} (${env.NODE_ENV})`);
});
