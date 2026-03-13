import { Injectable } from '@angular/core';

export interface StoredImage {
  id: string;
  dataUrl: string;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class ImageStoreService {
  private readonly dbName = 'birthday-camera-db';
  private readonly storeName = 'photos';
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
    });

    return this.dbPromise;
  }

  private waitForTransaction(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async addImage(dataUrl: string): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    const item: StoredImage = {
      id: crypto.randomUUID(),
      dataUrl,
      createdAt: Date.now()
    };
    store.add(item);
    await this.waitForTransaction(tx);
  }

  async getImages(): Promise<StoredImage[]> {
    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const request = store.getAll();

    const result = await new Promise<StoredImage[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as StoredImage[]);
      request.onerror = () => reject(request.error);
    });

    return result.sort((a, b) => a.createdAt - b.createdAt);
  }

  async clearImages(): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    tx.objectStore(this.storeName).clear();
    await this.waitForTransaction(tx);
  }
}
