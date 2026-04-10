import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

export type SavedAudioFile = {
  absolutePath: string;
  fileName: string;
  publicUrl: string;
};

function withTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

export class AudioStorage {
  constructor(
    private readonly storagePath: string,
    private readonly backendBaseUrl: string
  ) {}

  async saveAudio(
    id: string,
    file: {
      buffer: Buffer;
      extension: string;
    }
  ): Promise<SavedAudioFile> {
    await mkdir(this.storagePath, {
      recursive: true
    });

    const fileName = `${id}.${file.extension}`;
    const absolutePath = path.join(this.storagePath, fileName);

    await writeFile(absolutePath, file.buffer);

    return {
      absolutePath,
      fileName,
      publicUrl: new URL(
        `audio/${fileName}`,
        withTrailingSlash(this.backendBaseUrl)
      ).toString()
    };
  }
}
