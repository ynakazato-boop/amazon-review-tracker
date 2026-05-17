import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'reviews.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  migrate(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS asins (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      asin                 TEXT    NOT NULL UNIQUE,
      note                 TEXT,
      frequency            TEXT    NOT NULL DEFAULT 'daily',
      track_reviews        INTEGER NOT NULL DEFAULT 1,
      track_purchase_count INTEGER NOT NULL DEFAULT 1,
      created_at           DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS review_snapshots (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      asin_id              INTEGER NOT NULL REFERENCES asins(id) ON DELETE CASCADE,
      rating               REAL,
      review_count         INTEGER,
      purchase_count_label TEXT,
      measured_at          DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS execution_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at  DATETIME NOT NULL,
      finished_at DATETIME,
      total       INTEGER  DEFAULT 0,
      success     INTEGER  DEFAULT 0,
      failed      INTEGER  DEFAULT 0,
      status      TEXT     DEFAULT 'running'
    );
  `);
}

function migrate(db: Database.Database) {
  const asinCols = (db.prepare('PRAGMA table_info(asins)').all() as { name: string }[]).map(c => c.name);
  if (!asinCols.includes('track_reviews'))
    db.exec('ALTER TABLE asins ADD COLUMN track_reviews INTEGER NOT NULL DEFAULT 1');
  if (!asinCols.includes('track_purchase_count'))
    db.exec('ALTER TABLE asins ADD COLUMN track_purchase_count INTEGER NOT NULL DEFAULT 1');

  const snapCols = (db.prepare('PRAGMA table_info(review_snapshots)').all() as { name: string }[]).map(c => c.name);
  if (!snapCols.includes('purchase_count_label'))
    db.exec('ALTER TABLE review_snapshots ADD COLUMN purchase_count_label TEXT');
}

export default getDb;
