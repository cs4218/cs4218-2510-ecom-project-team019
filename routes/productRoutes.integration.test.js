import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import JWT from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import categoryModel from '../models/categoryModel.js';
import slugify from 'slugify';
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

describe('POST /api/v1/product/create-product', () => {
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

    it('should return 403 response if non-admin', async () => {
        const nonAdminUser = await userModel.create({
            name: 'Non Admin Tester',
            email: 'user@test.com',
            password: 'password123',
            phone: '12345678',
            address: '123 Somewhere St',
            answer: 'Something',
            role: 0, // admin flag
        });

        const nonAdminToken = JWT.sign(
            { _id: nonAdminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const category1 = await categoryModel.create({
            name: 'category1',
            slug: slugify('category1'),
        });

        const res = await request(app)
            .post('/api/v1/product/create-product') // endpoint to hit
            .set('Authorization', `${nonAdminToken}`)
            .field('name', 'Laptop')
            .field('description', 'A laptop')
            .field('price', '300')
            .field('category', category1._id.toString())
            .field('quantity', '30')
            .field('shipping', 'false')
            .expect(403); // expected HTTP status

        expect(res.body.success).toBe(false);
    });

    it('should return 401 response if not logged in', async () => {
        const category1 = await categoryModel.create({
            name: 'category1',
            slug: slugify('category1'),
        });

        const res = await request(app)
            .post('/api/v1/product/create-product') // endpoint to hit
            .field('name', 'Laptop')
            .field('description', 'A laptop')
            .field('price', '300')
            .field('category', category1._id.toString())
            .field('quantity', '30')
            .field('shipping', 'false')
            .expect(401); // expected HTTP status

        expect(res.body.success).toBe(false);
    });
});

describe('PUT /api/v1/product/update-product/:pid', () => {
    it('should update a product successfully if admin', async () => {
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

        const category2 = await categoryModel.create({
            name: 'category2',
            slug: slugify('category2'),
        });

        // Firstly, create the product
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
        expect(res.body.products).toHaveProperty('_id');

        const pid = res.body.products._id;

        // Then, update the product
        const res2 = await request(app)
            .put(`/api/v1/product/update-product/${pid}`)
            .set('Authorization', `${adminToken}`)
            .field('name', 'Widescreen TV')
            .field('description', 'A widescreen TV')
            .field('price', '30')
            .field('category', category2._id.toString())
            .field('quantity', '45')
            .field('shipping', 'true')
            .expect(200);

        expect(res2.body.success).toBe(true);
    });

    it('should return 403 response if non-admin', async () => {
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

        const nonAdminUser = await userModel.create({
            name: 'Non Admin Tester',
            email: 'user@test.com',
            password: 'password123',
            phone: '12345678',
            address: '123 Somewhere St',
            answer: 'Something',
            role: 0, // admin flag
        });

        const nonAdminToken = JWT.sign(
            { _id: nonAdminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const category1 = await categoryModel.create({
            name: 'category1',
            slug: slugify('category1'),
        });

        const category2 = await categoryModel.create({
            name: 'category2',
            slug: slugify('category2'),
        });

        // Firstly, create the product using admin token
        // (this should pass)
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
        expect(res.body.products).toHaveProperty('_id');

        const pid = res.body.products._id;

        // Then, update the product using non-admin token
        // (this should fail)
        const res2 = await request(app)
            .put(`/api/v1/product/update-product/${pid}`)
            .set('Authorization', `${nonAdminToken}`)
            .field('name', 'Widescreen TV')
            .field('description', 'A widescreen TV')
            .field('price', '30')
            .field('category', category2._id.toString())
            .field('quantity', '45')
            .field('shipping', 'true')
            .expect(403);

        expect(res2.body.success).toBe(false);
    });

    it('should return 401 response if not logged in', async () => {
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

        const category2 = await categoryModel.create({
            name: 'category2',
            slug: slugify('category2'),
        });

        // Firstly, create the product using admin token
        // (this should pass)
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
        expect(res.body.products).toHaveProperty('_id');

        const pid = res.body.products._id;

        // Then, update the product using no token
        // (this should fail)
        const res2 = await request(app)
            .put(`/api/v1/product/update-product/${pid}`)
            .field('name', 'Widescreen TV')
            .field('description', 'A widescreen TV')
            .field('price', '30')
            .field('category', category2._id.toString())
            .field('quantity', '45')
            .field('shipping', 'true')
            .expect(401);

        expect(res2.body.success).toBe(false);
    });
});
describe('DELETE /api/v1/product/delete-product/:pid', () => {
    it('should delete a product successfully if admin', async () => {
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

        // Firstly, create the product
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
        expect(res.body.products).toHaveProperty('_id');

        const pid = res.body.products._id;

        // Then, delete the product
        const res2 = await request(app)
            .delete(`/api/v1/product/delete-product/${pid}`)
            .set('Authorization', `${adminToken}`)
            .expect(200);

        expect(res2.body.success).toBe(true);
    });

    it('should return 403 response if non-admin', async () => {
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

        const nonAdminUser = await userModel.create({
            name: 'Non Admin Tester',
            email: 'user@test.com',
            password: 'password123',
            phone: '12345678',
            address: '123 Somewhere St',
            answer: 'Something',
            role: 0, // admin flag
        });

        const nonAdminToken = JWT.sign(
            { _id: nonAdminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const category1 = await categoryModel.create({
            name: 'category1',
            slug: slugify('category1'),
        });

        // Firstly, create the product using admin token
        // (this should pass)
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
        expect(res.body.products).toHaveProperty('_id');

        const pid = res.body.products._id;

        // Then, delete the product using non-admin token
        // (this should fail)
        const res2 = await request(app)
            .delete(`/api/v1/product/delete-product/${pid}`)
            .set('Authorization', `${nonAdminToken}`)
            .expect(403);

        expect(res2.body.success).toBe(false);
    });

    it('should return 401 response if not logged in', async () => {
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

        // Firstly, create the product using admin token
        // (this should pass)
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
        expect(res.body.products).toHaveProperty('_id');

        const pid = res.body.products._id;

        // Then, delete the product using no token
        // (this should fail)
        const res2 = await request(app)
            .delete(`/api/v1/product/delete-product/${pid}`)
            .expect(401);

        expect(res2.body.success).toBe(false);
    });
});
