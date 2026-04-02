interface Store {
    id: string;
    name: string;
    products: string[];
}

class StoreManager {
    static instance: StoreManager | null = null;

    static getInstance(): StoreManager {
        if(!StoreManager.instance) {
            StoreManager.instance = new StoreManager();
        }
        return StoreManager.instance;
    }

    private stores: Store[] = [];

    private constructor() {
        this.stores = [];
    }

    addStore(store: Store): void {
        this.stores.push(store);
    }

    addProductToStore(storeId: string, product: string): void {
        const store = this.getStoreById(storeId);
        if (store) {
            store.products.push(product);
        } else {            
            console.error(`Store with id ${storeId} not found.`);
        }
    }

    getStoreById(storeId: string): Store | undefined {
        return this.stores.find(store => store.id === storeId);
    }
}

export { StoreManager };