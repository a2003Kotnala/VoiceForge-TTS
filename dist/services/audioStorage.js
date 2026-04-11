"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioStorage = void 0;
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = require("node:fs/promises");
function withTrailingSlash(value) {
    return value.endsWith("/") ? value : `${value}/`;
}
class AudioStorage {
    storagePath;
    backendBaseUrl;
    constructor(storagePath, backendBaseUrl) {
        this.storagePath = storagePath;
        this.backendBaseUrl = backendBaseUrl;
    }
    async saveAudio(id, file) {
        await (0, promises_1.mkdir)(this.storagePath, {
            recursive: true
        });
        const fileName = `${id}.${file.extension}`;
        const absolutePath = node_path_1.default.join(this.storagePath, fileName);
        await (0, promises_1.writeFile)(absolutePath, file.buffer);
        return {
            absolutePath,
            fileName,
            publicUrl: new URL(`audio/${fileName}`, withTrailingSlash(this.backendBaseUrl)).toString()
        };
    }
}
exports.AudioStorage = AudioStorage;
