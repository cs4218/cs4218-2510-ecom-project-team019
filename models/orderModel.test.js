import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server'; // (an in-memory MongoDB) so that can test schema without touching a real DB
import Order from '../models/orderModel.js';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Order Model', () => {
    it('should create an order with default status', async () => {
        const order = await Order.create({
            products: [new mongoose.Types.ObjectId()],
            payment: { amount: 100 },
            buyer: new mongoose.Types.ObjectId(),
        });

        expect(order.status).toBe('Not Process');
        expect(order.products).toHaveLength(1);
        expect(order.payment.amount).toBe(100);
    });

    it('should not allow invalid status', async () => {
        const order = new Order({
            products: [new mongoose.Types.ObjectId()],
            payment: { amount: 50 },
            buyer: new mongoose.Types.ObjectId(),
            status: 'InvalidStatus',
        });

        let error;
        try {
            await order.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error.errors.status).toBeDefined();
    });

    it('should allow valid status updates', async () => {
        const order = await Order.create({
            products: [new mongoose.Types.ObjectId()],
            payment: { amount: 200 },
            buyer: new mongoose.Types.ObjectId(),
        });

        order.status = 'Processing';
        await expect(order.save()).resolves.not.toThrow();
        expect(order.status).toBe('Processing');
    });
});
