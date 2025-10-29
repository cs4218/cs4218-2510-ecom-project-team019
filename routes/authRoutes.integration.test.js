import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import JWT from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import categoryModel from '../models/categoryModel.js';
import productModel from '../models/productModel.js';
import orderModel from '../models/orderModel.js';
import dotenv from 'dotenv';

dotenv.config();
process.env.JWT_SECRET ||= 'testsecret';

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

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// UpdateProfileController
describe('PUT /api/v1/auth/profile', () => {
    let nonAdminUser;

    beforeEach(async () => {
        nonAdminUser = await userModel.create({
            name: 'Test User',
            email: 'testuser@gmail.com',
            password: 'testpassword',
            phone: '12341234',
            address: 'CLB',
            answer: 'something',
            role: 0, // non-admin user
        });
    });

    afterEach(async () => {
        // Clear collections after each test
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    it('updates the user profile successfully when given valid data', async () => {
        const token = JWT.sign(
            { _id: nonAdminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const body = {
            name: 'Updated User Name',
            password: 'updatedpassword',
            phone: '99998888',
            address: 'UTown',
        };

        const res = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', `${token}`)
            .send(body);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toEqual(expect.any(String));
        expect(res.body.updatedUser.name).toBe('Updated User Name');
        expect(res.body.updatedUser.phone).toBe('99998888');
        expect(res.body.updatedUser.address).toBe('UTown');
    });

    it('should reject update when password is too short', async () => {
        const token = JWT.sign(
            { _id: nonAdminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const res = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', `${token}`)
            .send({ password: '123' }) // invalid length password

        expect(res.status).toBe(400);
        expect(res.body.error).toBe(
            'Password must be at least 6 characters long'
        );
    });

    it(`returns a 401 error if JWT is not defined when making API request`, async () => {
        const invalidToken = 'invalid token';

        const res = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', `${invalidToken}`);

        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({
            success: false,
            message: expect.any(String),
        });
        expect(res.body.message).toMatch(/unauthorized/i);
    });
});

// GetOrdersController
describe('GET /api/v1/auth/orders', () => {
    let nonAdminUser;

    beforeEach(async () => {
        const testCategory = await categoryModel.create({
            name: 'Books',
            slug: 'books',
        });

        const testProduct1 = await productModel.create({
            name: 'Book',
            slug: 'book-slug',
            description: 'A good book',
            price: 10,
            category: testCategory._id,
            quantity: 3,
        });

        const testProduct2 = await productModel.create({
            name: 'Laptop',
            slug: 'laptop-slug',
            description: 'A solid laptop',
            price: 250,
            category: testCategory._id,
            quantity: 1,
        });

        nonAdminUser = await userModel.create({
            name: 'Test User',
            email: 'testuser@gmail.com',
            password: 'testpassword',
            phone: '12341234',
            address: 'CLB',
            answer: 'something',
            role: 0, // non-admin user
        });

        await orderModel.create({
            products: [testProduct1._id, testProduct2._id],
            payment: { method: 'card' },
            buyer: nonAdminUser._id,
            status: 'Processing',
        });
    });

    afterEach(async () => {
        // Clear collections after each test
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    it(`retrieves a user's orders successfully`, async () => {
        const nonAdminToken = JWT.sign(
            { _id: nonAdminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const res = await request(app)
            .get('/api/v1/auth/orders')
            .set('Authorization', `${nonAdminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toEqual(expect.any(String));

        expect(Array.isArray(res.body.orders)).toBe(true);
        expect(res.body.orders.length).toBe(1);

        const order = res.body.orders[0];
        expect(Array.isArray(order.products)).toBe(true);
        expect(order.products.length).toBe(2);
        expect(order.products[0].name).toBe('Book');
        expect(order.products[1].name).toBe('Laptop');
        expect(order.buyer.name).toBe('Test User');
        expect(order.status).toBe('Processing');
    });

    it(`returns a 401 error if JWT is not defined when making API request`, async () => {
        const invalidToken = 'invalid token';

        const res = await request(app)
            .get('/api/v1/auth/orders')
            .set('Authorization', `${invalidToken}`);

        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({
            success: false,
            message: expect.any(String),
        });
        expect(res.body.message).toMatch(/unauthorized/i);
    });
});

// GetAllOrdersController
describe('GET /api/v1/auth/all-orders', () => {
    let adminUser;

    beforeEach(async () => {
        const testCategory = await categoryModel.create({
            name: 'Books',
            slug: 'books',
        });

        const testProduct1 = await productModel.create({
            name: 'Book',
            slug: 'book-slug',
            description: 'A good book',
            price: 10,
            category: testCategory._id,
            quantity: 3,
        });

        const testProduct2 = await productModel.create({
            name: 'Laptop',
            slug: 'laptop-slug',
            description: 'A solid laptop',
            price: 250,
            category: testCategory._id,
            quantity: 1,
        });

        adminUser = await userModel.create({
            name: 'Test User',
            email: 'testuser@gmail.com',
            password: 'testpassword',
            phone: '12341234',
            address: 'CLB',
            answer: 'something',
            role: 1, // admin user
        });

        await orderModel.create({
            products: [testProduct1._id, testProduct2._id],
            payment: { method: 'card' },
            buyer: adminUser._id,
            status: 'Processing',
        });
    });

    afterEach(async () => {
        // Clear collections after each test
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    it(`retrieves ALL orders successfully`, async () => {
        const adminToken = JWT.sign(
            { _id: adminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const res = await request(app)
            .get('/api/v1/auth/orders')
            .set('Authorization', `${adminToken}`);

        expect(res.status).toBe(200);

        expect(Array.isArray(res.body.orders)).toBe(true);
        expect(res.body.orders.length).toBe(1);

        const order = res.body.orders[0];
        expect(Array.isArray(order.products)).toBe(true);
        expect(order.products.length).toBe(2);
        expect(order.products[0].name).toBe('Book');
        expect(order.products[1].name).toBe('Laptop');
        expect(order.buyer.name).toBe('Test User');
        expect(order.status).toBe('Processing');
    });

    it(`returns a 401 error if JWT is not defined when making API request`, async () => {
        const invalidToken = 'invalid token';

        const res = await request(app)
            .get('/api/v1/auth/all-orders')
            .set('Authorization', `${invalidToken}`);

        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({
            success: false,
            message: expect.any(String),
        });
        expect(res.body.message).toMatch(/unauthorized/i);
    });

    it(`returns a 403 Unauthorized error if user is not an admin`, async () => {
        adminUser = await userModel.findByIdAndUpdate(adminUser._id, { role: 0 })
        
        const token = JWT.sign(
            { _id: adminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const res = await request(app)
            .get('/api/v1/auth/all-orders')
            .set('Authorization', `${token}`);

        expect(res.status).toBe(403);
        expect(res.body).toMatchObject({
            success: false,
            message: expect.any(String),
        });
        expect(res.body.message).toMatch(/forbidden/i);
    });
});

// OrderStatusController
describe('PUT /api/v1/auth/order-status/:orderId', () => {
    let adminUser, testOrder;

    beforeEach(async () => {
        const testCategory = await categoryModel.create({
            name: 'Books',
            slug: 'books',
        });

        const testProduct1 = await productModel.create({
            name: 'Book',
            slug: 'book-slug',
            description: 'A good book',
            price: 10,
            category: testCategory._id,
            quantity: 3,
        });

        const testProduct2 = await productModel.create({
            name: 'Laptop',
            slug: 'laptop-slug',
            description: 'A solid laptop',
            price: 250,
            category: testCategory._id,
            quantity: 1,
        });

        adminUser = await userModel.create({
            name: 'Test User',
            email: 'testuser@gmail.com',
            password: 'testpassword',
            phone: '12341234',
            address: 'CLB',
            answer: 'something',
            role: 1, // admin user
        });

        testOrder = await orderModel.create({
            products: [testProduct1._id, testProduct2._id],
            payment: { method: 'card' },
            buyer: adminUser._id,
            status: 'Processing',
        });
    });

    afterEach(async () => {
        // Clear collections after each test
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    it(`updates order status successfully to 'Shipped'`, async () => {
        const adminToken = JWT.sign(
            { _id: adminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const res = await request(app)
            .put(`/api/v1/auth/order-status/${testOrder._id}`)
            .set('Authorization', `${adminToken}`)
            .send({ status: 'Shipped' })

        expect(res.status).toBe(200);

        const order = res.body;
        expect(Array.isArray(order.products)).toBe(true);
        expect(order.products.length).toBe(2);
        expect(order.status).toBe('Shipped');
    });

    it(`returns a 401 error if JWT is not defined when making API request`, async () => {
        const invalidToken = 'invalid token';

        const res = await request(app)
            .put(`/api/v1/auth/order-status/${testOrder._id}`)
            .set('Authorization', `${invalidToken}`);

        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({
            success: false,
            message: expect.any(String),
        });
        expect(res.body.message).toMatch(/unauthorized/i);
    });

    it(`returns a 403 Unauthorized error if user is not an admin`, async () => {
        adminUser = await userModel.findByIdAndUpdate(adminUser._id, { role: 0 })
        
        const token = JWT.sign(
            { _id: adminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const res = await request(app)
            .put(`/api/v1/auth/order-status/${testOrder._id}`)
            .set('Authorization', `${token}`);

        expect(res.status).toBe(403);
        expect(res.body).toMatchObject({
            success: false,
            message: expect.any(String),
        });
        expect(res.body.message).toMatch(/forbidden/i);
    });
});
