import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import JWT from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import categoryModel from '../models/categoryModel.js';
import slugify from 'slugify';

jest.mock('braintree', () => {
    const mockGateway = {
        clientToken: {
            generate: jest.fn(),
        },
        transaction: {
            sale: jest.fn(),
        },
    };
    return {
        BraintreeGateway: jest.fn(() => mockGateway),
        Environment: { Sandbox: 'Sandbox' },
    };
});

// Setup in-memory MongoDB server
let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterEach(async () => {
    // Clear collections after each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('GET /api/v1/product/get-product', () => {
    it('should return all products', async () => {
        const res = await request(app)
            .get('/api/v1/product/get-product') // endpoint to hit
            .expect(200); // expected HTTP status

        expect(res.body).toEqual({
            success: true,
            length: 0,
            message: 'All Products',
            products: [],
        });
    });
});

describe('POST /api/v1/product/get-product', () => {
    it('should add a product successfully if admin', async () => {
        const adminUser = await userModel.create({
            name: 'Admin Tester',
            email: 'admin@test.com',
            password: 'password123',
            phone: '12345678',
            address: '123 Somewhere St',
            answer: 'Something',
            role: 1, // admin flag
        });

        const adminToken = JWT.sign(
            { _id: adminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const category1 = await categoryModel.create({
            name: 'category1',
            slug: slugify('category1'),
        });

        const res = await request(app)
            .post('/api/v1/product/create-product') // endpoint to hit
            .set('Authorization', `${adminToken}`)
            .field('name', 'Laptop')
            .field('description', 'A laptop')
            .field('price', '300')
            .field('category', category1._id.toString())
            .field('quantity', '30')
            .field('shipping', 'false')
            .expect(201); // expected HTTP status

        expect(res.body.success).toBe(true);
    });
});
