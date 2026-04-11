"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryRepository = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = require("node:fs");
const sql_js_1 = __importDefault(require("sql.js"));
let sqlPromise;
function getSqlInstance() {
    if (!sqlPromise) {
        const packageRoot = node_path_1.default.dirname(require.resolve("sql.js"));
        sqlPromise = (0, sql_js_1.default)({
            locateFile: (file) => node_path_1.default.join(packageRoot, file)
        });
    }
    return sqlPromise;
}
class HistoryRepository {
    databasePath;
    db;
    constructor(databasePath, db) {
        this.databasePath = databasePath;
        this.db = db;
    }
    static async create(databasePath) {
        (0, node_fs_1.mkdirSync)(node_path_1.default.dirname(databasePath), {
            recursive: true
        });
        const SQL = await getSqlInstance();
        const db = (0, node_fs_1.existsSync)(databasePath)
            ? new SQL.Database((0, node_fs_1.readFileSync)(databasePath))
            : new SQL.Database();
        const repository = new HistoryRepository(databasePath, db);
        repository.db.run(`
      CREATE TABLE IF NOT EXISTS generation_history (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        voice TEXT NOT NULL,
        voice_label TEXT,
        language TEXT NOT NULL,
        emotion TEXT NOT NULL DEFAULT 'neutral',
        status TEXT NOT NULL,
        provider TEXT NOT NULL,
        audio_url TEXT,
        metadata TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
        repository.ensureColumn("voice_label", "TEXT");
        repository.ensureColumn("emotion", "TEXT NOT NULL DEFAULT 'neutral'");
        repository.persist();
        return repository;
    }
    createPending(entry) {
        this.db.run(`
        INSERT INTO generation_history (
          id,
          text,
          voice,
          voice_label,
          language,
          emotion,
          status,
          provider,
          metadata,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'processing', ?, ?, ?, ?)
      `, [
            entry.id,
            entry.text,
            entry.voice,
            entry.voiceLabel ?? null,
            entry.language,
            entry.emotion,
            entry.provider,
            entry.metadata ? JSON.stringify(entry.metadata) : null,
            entry.createdAt,
            entry.createdAt
        ]);
        this.persist();
    }
    markCompleted(id, completion) {
        this.db.run(`
        UPDATE generation_history
        SET
          status = 'completed',
          audio_url = ?,
          metadata = ?,
          error_message = NULL,
          updated_at = ?
        WHERE id = ?
      `, [
            completion.audioUrl,
            completion.metadata ? JSON.stringify(completion.metadata) : null,
            completion.updatedAt,
            id
        ]);
        this.persist();
        return this.getById(id);
    }
    markFailed(id, failure) {
        this.db.run(`
        UPDATE generation_history
        SET
          status = 'failed',
          metadata = ?,
          error_message = ?,
          updated_at = ?
        WHERE id = ?
      `, [
            failure.metadata ? JSON.stringify(failure.metadata) : null,
            failure.errorMessage,
            failure.updatedAt,
            id
        ]);
        this.persist();
        return this.getById(id);
    }
    listRecent(limit = 10) {
        return this.query(`
        SELECT *
        FROM generation_history
        ORDER BY created_at DESC
        LIMIT ?
      `, [limit]);
    }
    getById(id) {
        const rows = this.query(`
        SELECT *
        FROM generation_history
        WHERE id = ?
      `, [id]);
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
    ensureColumn(name, definition) {
        const statement = this.db.exec("PRAGMA table_info(generation_history);");
        const columnNames = statement[0]?.values.map((row) => String(row[1]).toLowerCase()) ?? [];
        if (!columnNames.includes(name.toLowerCase())) {
            this.db.run(`ALTER TABLE generation_history ADD COLUMN ${name} ${definition};`);
        }
    }
    query(sql, params) {
        const statement = this.db.prepare(sql, params);
        const rows = [];
        while (statement.step()) {
            rows.push(this.mapRow(statement.getAsObject()));
        }
        statement.free();
        return rows;
    }
    persist() {
        (0, node_fs_1.writeFileSync)(this.databasePath, Buffer.from(this.db.export()));
    }
    mapRow(row) {
        return {
            id: row.id,
            text: row.text,
            voice: row.voice,
            voiceLabel: row.voice_label,
            language: row.language,
            emotion: row.emotion ?? "neutral",
            status: row.status,
            provider: row.provider,
            audioUrl: row.audio_url,
            metadata: row.metadata
                ? JSON.parse(row.metadata)
                : null,
            errorMessage: row.error_message,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.HistoryRepository = HistoryRepository;
