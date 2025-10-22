import express from 'express';
import morgan from 'morgan';
import authRoutes from './routes/authRoute.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cors from 'cors';
import { seedTestData } from './config/db.js';

const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

//routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/product', productRoutes);

// rest api

app.get('/', (req, res) => {
    res.send('<h1>Welcome to ecommerce app</h1>');
});

// test reset endpoint to convert back to seeded DB state
app.post('/api/v1/test/reset', async (req, res) => {
    try {
        await seedTestData();
        res.status(200).send('Reset test data successfully');
    } catch (e) {
        res.status(500).send('Error when resetting test data');
    }
});

export default app;
