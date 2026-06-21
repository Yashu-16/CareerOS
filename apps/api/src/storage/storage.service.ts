import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

/**
 * Local-disk storage for the MVP. Swapping to S3 later only requires
 * reimplementing this one class — every caller depends on this interface,
 * not on `fs` directly.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseDir: string;

  constructor(private readonly config: ConfigService) {
    this.baseDir = this.config.get<string>('UPLOAD_DIR') || path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveBuffer(buffer: Buffer, originalFileName: string, subDir = 'resumes'): Promise<string> {
    const dir = path.join(this.baseDir, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const ext = path.extname(originalFileName);
    const key = `${subDir}/${randomUUID()}${ext}`;
    const fullPath = path.join(this.baseDir, key);
    await fs.promises.writeFile(fullPath, buffer);
    this.logger.log(`Saved file to ${fullPath}`);
    return key;
  }

  async readBuffer(storageKey: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, storageKey);
    return fs.promises.readFile(fullPath);
  }

  getAbsolutePath(storageKey: string): string {
    return path.join(this.baseDir, storageKey);
  }

  async delete(storageKey: string): Promise<void> {
    const fullPath = path.join(this.baseDir, storageKey);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }
}
