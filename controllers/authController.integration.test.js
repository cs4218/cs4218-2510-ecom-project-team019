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
import * as authHelper from '../helpers/authHelper.js';
import JWT from 'jsonwebtoken';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('integration test: updateProfileController', () => {
    let res;
    let testUser;
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
        await userModel.findByIdAndDelete(testUser._id);
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
                message: expect.any(String)
            })
        );
    });
});
