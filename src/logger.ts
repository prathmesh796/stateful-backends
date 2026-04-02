import { db } from './db.js';

export class Logger {
    static log(message: string) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    static logStoreCreation(storeId: string) {
        const store = db.getStoreById(storeId);
        if (store) {
            Logger.log(`Store created: ${store.name} (ID: ${store.id})`);
        } else {
            Logger.log(`Store with ID ${storeId} not found.`);
        }
    }

    static logProductAddition(storeId: string, product: string) {
        const store = db.getStoreById(storeId);
        if (store) {
            Logger.log(`Product "${product}" added to store: ${store.name} (ID: ${store.id})`);
        } else {
            Logger.log(`Store with ID ${storeId} not found.`);
        }
    }

    static logError(error: Error) {
        Logger.log(`Error: ${error.message}`);
    }
}