export interface StorageUploadOptions {
  ttlSeconds?: number;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StorageUploadResult {
  key: string;
  url: string;
  expiresAt?: number;
}

export interface StorageAdapter {
  upload(
    key: string,
    file: Blob | File | ArrayBuffer | Uint8Array,
    options?: StorageUploadOptions
  ): Promise<StorageUploadResult>;

  download(key: string): Promise<Blob>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;
}
