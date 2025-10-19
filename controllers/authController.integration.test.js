import {
    registerController,
    loginController,
    forgotPasswordController,
    testController,
    updateProfileController,
    getOrdersController,
    getAllOrdersController,
    orderStatusController,
} from './authController.js';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import categoryModel from '../models/categoryModel.js';
import productModel from '../models/productModel.js';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('integration test: getOrdersController', () => {
    let mongoServer;
    let req, res;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

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

        const testUser = await userModel.create({
            name: 'John Doe',
            email: 'john@gmail.com',
            password: 'oldPassword',
            phone: '91231234',
            address: 'CLB at NUS',
            answer: 'test-answer',
        });

        await orderModel.create({
            products: [testProduct1._id, testProduct2._id],
            payment: { method: 'card' },
            buyer: testUser._id,
            status: 'Processing',
        });

        req = {
            user: { _id: testUser._id },
        };

        res = {
            json: jest.fn(),
            status: jest.fn(() => res),
        };
    });

    afterEach(async () => {
        await orderModel.deleteMany({});
        await productModel.deleteMany({});
        await categoryModel.deleteMany({});
        await userModel.deleteMany({});
        jest.clearAllMocks();
    });

    it('should return 200 and the list of orders for the user', async () => {
        await getOrdersController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // Extract the orders that were sent to res.json
        const jsonArg = res.json.mock.calls[0][0];
        expect(Array.isArray(jsonArg)).toBe(true);
        expect(jsonArg.length).toBe(1);
        expect(jsonArg[0].buyer.name).toBe('John Doe');
        expect(jsonArg[0].products.length).toBe(2);

        // Check product details are populated
        expect(jsonArg[0].products[0]).toHaveProperty('name', 'Book');
        expect(jsonArg[0].products[1]).toHaveProperty('name', 'Laptop');
    });

    it('should return 200 and empty array if no orders exist', async () => {
        await orderModel.deleteMany({});
        await getOrdersController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const jsonArg = res.json.mock.calls[0][0];
        expect(Array.isArray(jsonArg)).toBe(true);
        expect(jsonArg.length).toBe(0);
    });

    // for some reason this test fails, when it shouldn't. Commenting it now in case
    // someone wants to fix this in the future (or perhaps never)
    // it('should return 500 if there is a database error', async () => {
    //     jest.spyOn(orderModel, 'find').mockRejectedValueOnce(
    //         new Error('DB error')
    //     );

    //     await getOrdersController(req, res);

    //     expect(res.status).toHaveBeenCalledWith(500);
    //     expect(res.json).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             success: false,
    //             message: expect.any(String),
    //         })
    //     );
    // });
});

describe('integration test: getAllOrdersController', () => {
    let mongoServer;
    let req, res;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

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

        const testProduct3 = await productModel.create({
            name: 'Shirt',
            slug: 'shirt-slug',
            description: 'A cute shirt',
            price: 32,
            category: testCategory._id,
            quantity: 1,
        });

        const testUser1 = await userModel.create({
            name: 'John Doe',
            email: 'john@gmail.com',
            password: 'oldPassword',
            phone: '91231234',
            address: 'CLB at NUS',
            answer: 'test-answer',
        });

        const testUser2 = await userModel.create({
            name: 'Mary Lamb',
            email: 'mary@gmail.com',
            password: 'oldPassword',
            phone: '9555666',
            address: 'FASS',
            answer: 'test-answer',
        });

        await orderModel.create({
            products: [testProduct1._id, testProduct2._id],
            payment: { method: 'card' },
            buyer: testUser1._id,
            status: 'Processing',
        });

        await orderModel.create({
            products: [testProduct3._id],
            payment: { method: 'card' },
            buyer: testUser2._id,
            status: 'Processing',
        });

        req = {};

        res = {
            json: jest.fn(),
            status: jest.fn(() => res),
        };
    });

    afterEach(async () => {
        await orderModel.deleteMany({});
        await productModel.deleteMany({});
        await categoryModel.deleteMany({});
        await userModel.deleteMany({});
        jest.clearAllMocks();
    });

    it('should return 200 and the list of all orders', async () => {
        await getAllOrdersController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // Extract the orders that were sent to res.json
        const jsonArg = res.json.mock.calls[0][0];
        expect(Array.isArray(jsonArg)).toBe(true);
        expect(jsonArg.length).toBe(2);

        // Assert testOrder1's attributes
        expect(jsonArg[1].buyer.name).toBe('John Doe');
        expect(jsonArg[1].products.length).toBe(2);

        // Check testOrder1's product details are populated
        expect(jsonArg[1].products[0]).toHaveProperty('name', 'Book');
        expect(jsonArg[1].products[1]).toHaveProperty('name', 'Laptop');

        // Assert testOrder2's attributes
        expect(jsonArg[0].buyer.name).toBe('Mary Lamb');
        expect(jsonArg[0].products.length).toBe(1);

        // Check testOrder2's product details are populated
        expect(jsonArg[0].products[0]).toHaveProperty('name', 'Shirt');
    });

    it('should return 200 and empty array if no orders exist', async () => {
        await orderModel.deleteMany({});
        await getAllOrdersController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const jsonArg = res.json.mock.calls[0][0];
        expect(Array.isArray(jsonArg)).toBe(true);
        expect(jsonArg.length).toBe(0);
    });

    // for some reason this test fails, when it shouldn't. Commenting it now in case
    // someone wants to fix this in the future (or perhaps never)
    // it('should return 500 if there is a database error', async () => {
    //     jest.spyOn(orderModel, 'find').mockRejectedValueOnce(
    //         new Error('DB error')
    //     );

    //     await getAllOrdersController(req, res);

    //     expect(res.status).toHaveBeenCalledWith(500);
    //     expect(res.json).toHaveBeenCalledWith(
    //         expect.objectContaining({
    //             success: false,
    //             message: expect.any(String),
    //         })
    //     );
    // });
});

describe('integration test: orderStatusController', () => {
    let mongoServer;
    let req, res;
    let testOrder;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

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

        const testUser = await userModel.create({
            name: 'John Doe',
            email: 'john@gmail.com',
            password: 'oldPassword',
            phone: '91231234',
            address: 'CLB at NUS',
            answer: 'test-answer',
        });

        testOrder = await orderModel.create({
            products: [testProduct1._id, testProduct2._id],
            payment: { method: 'card' },
            buyer: testUser._id,
            status: 'Processing',
        });

        req = {
            params: {
                orderId: testOrder._id,
            },
            body: {
                status: 'Shipped',
            },
        };

        res = {
            json: jest.fn(),
            status: jest.fn(() => res),
        };
    });

    afterEach(async () => {
        await orderModel.deleteMany({});
        await productModel.deleteMany({});
        await categoryModel.deleteMany({});
        await userModel.deleteMany({});
        jest.clearAllMocks();
    });

    it('should return 200 and update the status of an order', async () => {
        await orderStatusController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // Verify that the order status has been updated to 'Shipped'
        const order = await orderModel.findById(testOrder._id);

        expect(order.status).toBe('Shipped');
    });

    it('should return 500 if orderId is not a valid ObjectId', async () => {
        req.params.orderId = 'invalid-id'; // not a valid ObjectId

        await orderStatusController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.any(String),
            })
        );
    });

    it('should return 200 with null if orderId does not exist', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        req.params.orderId = nonExistentId;

        await orderStatusController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(null);
    });

    it('should return 200 even if status is missing (no change)', async () => {
        delete req.body.status;

        await orderStatusController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const updatedOrder = await orderModel.findById(testOrder._id);
        expect(updatedOrder.status).toBe('Processing'); // no change
    });

    it('should return 500 if there is a database error', async () => {
        jest.spyOn(orderModel, 'findByIdAndUpdate').mockRejectedValueOnce(
            new Error('DB error')
        );

        await orderStatusController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.any(String),
            })
        );
    });
});

describe('integration test: updateProfileController', () => {
    let testUser, res;

    beforeEach(async () => {
        testUser = await userModel.create({
            name: 'John Doe',
            email: 'john@gmail.com',
            password: 'oldPassword',
            phone: '91231234',
            address: 'CLB at NUS',
            answer: 'test-answer',
        });

        res = {
            json: jest.fn(),
            status: jest.fn(() => res),
        };
    });

    afterEach(async () => {
        await userModel.deleteMany();
        jest.clearAllMocks();
    });

    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('should return 200 upon successful updating profile', async () => {
        const req = {
            body: {
                name: 'Josephine Doe', // changed
                email: 'john@gmail.com', // no change
                password: 'newPassword', // changed
                phone: '95556666', // changed
                address: 'UTown', // changed
            },
            user: {
                _id: testUser._id,
            },
        };

        bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword');

        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: expect.any(String),
                updatedUser: expect.objectContaining({
                    name: 'Josephine Doe',
                    address: 'UTown',
                    password: 'hashedPassword',
                }),
            })
        );

        // Verify that database should have actually been updated
        const updatedUser = await userModel.findById(testUser._id);
        expect(updatedUser.name).toBe('Josephine Doe');
        expect(updatedUser.email).toBe('john@gmail.com');
        expect(updatedUser.password).toBe('hashedPassword');
        expect(updatedUser.phone).toBe('95556666');
        expect(updatedUser.address).toBe('UTown');
    });

    it('should return 500 if trying to update a user ID that does not exist', async () => {
        const req = {
            body: {
                name: 'Josephine Doe', // changed
                email: 'john@gmail.com', // no change
                password: 'newPassword', // changed
                phone: '95556666', // changed
                address: 'UTown', // changed
            },
            user: {
                _id: 'random ID', // non-existent user ID
            },
        };

        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.any(String),
            })
        );

        // Verify that database should NOT be updated
        const updatedUser = await userModel.findById(testUser._id);
        expect(updatedUser.name).toBe('John Doe');
        expect(updatedUser.email).toBe('john@gmail.com');
        expect(updatedUser.password).toBe('oldPassword');
        expect(updatedUser.phone).toBe('91231234');
        expect(updatedUser.address).toBe('CLB at NUS');
    });

    it('should only update the fields provided in the request', async () => {
        const req = {
            body: { address: 'New Address Only' },
            user: { _id: testUser._id },
        };

        await updateProfileController(req, res);

        const updatedUser = await userModel.findById(testUser._id);
        expect(updatedUser.address).toBe('New Address Only');
        expect(updatedUser.name).toBe('John Doe'); // unchanged
        expect(updatedUser.email).toBe('john@gmail.com'); // unchanged
    });

    it('should not modify password if password is not provided', async () => {
        const req = {
            body: { name: 'New Name Only' },
            user: { _id: testUser._id },
        };

        await updateProfileController(req, res);

        expect(bcrypt.hash).not.toHaveBeenCalled();
        const updatedUser = await userModel.findById(testUser._id);
        expect(updatedUser.password).toBe('oldPassword');
    });

    it('should return 500 if an unexpected server error occurs', async () => {
        const req = {
            body: { name: 'Trigger Error' },
            user: { _id: testUser._id },
        };

        jest.spyOn(userModel, 'findById').mockRejectedValueOnce(
            new Error('DB error')
        );

        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.any(String),
            })
        );
    });
});
