import path from "node:path";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";

import initSqlJs, { type Database } from "sql.js";

export type GenerationStatus = "processing" | "completed" | "failed";

export type HistoryRecord = {
  id: string;
  text: string;
  voice: string;
  language: string;
  status: GenerationStatus;
  provider: string;
  audioUrl: string | null;
  metadata: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

type DatabaseRow = {
  id: string;
  text: string;
  voice: string;
  language: string;
  status: GenerationStatus;
  provider: string;
  audio_url: string | null;
  metadata: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

let sqlPromise: ReturnType<typeof initSqlJs> | undefined;

function getSqlInstance() {
  if (!sqlPromise) {
    const packageRoot = path.dirname(require.resolve("sql.js"));

    sqlPromise = initSqlJs({
      locateFile: (file: string) => path.join(packageRoot, file)
    });
  }

  return sqlPromise;
}

export class HistoryRepository {
  private constructor(
    private readonly databasePath: string,
    private readonly db: Database
  ) {}

  static async create(databasePath: string) {
    mkdirSync(path.dirname(databasePath), {
      recursive: true
    });

    const SQL = await getSqlInstance();
    const db = existsSync(databasePath)
      ? new SQL.Database(readFileSync(databasePath))
      : new SQL.Database();

    const repository = new HistoryRepository(databasePath, db);
    repository.db.run(`
      CREATE TABLE IF NOT EXISTS generation_history (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        voice TEXT NOT NULL,
        language TEXT NOT NULL,
        status TEXT NOT NULL,
        provider TEXT NOT NULL,
        audio_url TEXT,
        metadata TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    repository.persist();

    return repository;
  }

  createPending(entry: {
    id: string;
    text: string;
    voice: string;
    language: string;
    provider: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
  }) {
    this.db.run(
      `
        INSERT INTO generation_history (
          id,
          text,
          voice,
          language,
          status,
          provider,
          metadata,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, 'processing', ?, ?, ?, ?)
      `,
      [
        entry.id,
        entry.text,
        entry.voice,
        entry.language,
        entry.provider,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.createdAt,
        entry.createdAt
      ]
    );

    this.persist();
  }

  markCompleted(
    id: string,
    completion: {
      audioUrl: string;
      metadata?: Record<string, unknown>;
      updatedAt: string;
    }
  ): HistoryRecord {
    this.db.run(
      `
        UPDATE generation_history
        SET
          status = 'completed',
          audio_url = ?,
          metadata = ?,
          error_message = NULL,
          updated_at = ?
        WHERE id = ?
      `,
      [
        completion.audioUrl,
        completion.metadata ? JSON.stringify(completion.metadata) : null,
        completion.updatedAt,
        id
      ]
    );

    this.persist();
    return this.getById(id);
  }

  markFailed(
    id: string,
    failure: {
      errorMessage: string;
      metadata?: Record<string, unknown>;
      updatedAt: string;
    }
  ): HistoryRecord {
    this.db.run(
      `
        UPDATE generation_history
        SET
          status = 'failed',
          metadata = ?,
          error_message = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        failure.metadata ? JSON.stringify(failure.metadata) : null,
        failure.errorMessage,
        failure.updatedAt,
        id
      ]
    );

    this.persist();
    return this.getById(id);
  }

  listRecent(limit = 10): HistoryRecord[] {
    return this.query(
      `
        SELECT *
        FROM generation_history
        ORDER BY created_at DESC
        LIMIT ?
      `,
      [limit]
    );
  }

  getById(id: string): HistoryRecord {
    const rows = this.query(
      `
        SELECT *
        FROM generation_history
        WHERE id = ?
      `,
      [id]
    );

    const row = rows[0];

    if (!row) {
      throw new Error(`History record ${id} was not found.`);
    }

    return row;
  }

  close() {
    this.persist();
    this.db.close();
  }

  private query(sql: string, params: Array<string | number | null>) {
    const statement = this.db.prepare(sql, params);
    const rows: HistoryRecord[] = [];

    while (statement.step()) {
      rows.push(this.mapRow(statement.getAsObject() as DatabaseRow));
    }

    statement.free();
    return rows;
  }

  private persist() {
    writeFileSync(this.databasePath, Buffer.from(this.db.export()));
  }

  private mapRow(row: DatabaseRow): HistoryRecord {
    return {
      id: row.id,
      text: row.text,
      voice: row.voice,
      language: row.language,
      status: row.status,
      provider: row.provider,
      audioUrl: row.audio_url,
      metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
