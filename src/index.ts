import express from 'express';
import { db } from './db.js';
import { Logger } from './logger.js';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/store', (req, res) => {
    const { id, name } = req.body;
    if (!id || !name) {
        return res.status(400).json({ error: 'Store id and name are required.' });
    }

    db.addStore({ id, name, products: [] });
    Logger.logStoreCreation(id);

    res.status(201).json({ message: 'Store created successfully.' });
});

app.post('/store/:id/product', (req, res) => {
    const storeId = req.params.id;
    const { product } = req.body;
    if (!product) {
        return res.status(400).json({ error: 'Product name is required.' });
    }

    db.addProductToStore(storeId, product);
    Logger.logProductAddition(storeId, product);
    Logger.log(`Product "${product}" added to store: ${db.getStoreById(storeId)?.name} (ID: ${storeId})`);
    
    res.status(200).json({ message: 'Product added to store successfully.' });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});