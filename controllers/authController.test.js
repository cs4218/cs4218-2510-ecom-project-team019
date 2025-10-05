import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import * as authHelper from '../helpers/authHelper.js';
import {
    updateProfileController,
    getOrdersController,
    getAllOrdersController,
    orderStatusController,
} from './authController.js';

jest.mock('../helpers/authHelper', () => ({
    hashPassword: jest.fn((password) => {
        return password + 'hash'; // simple hashing strategy
    }),
}));

describe('getOrdersController', () => {
    let req, res;
    beforeEach(() => {
        req = {
            user: {
                _id: 'user1ID',
            },
        };

        res = {
            json: jest.fn(),
            status: jest.fn(() => res),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 200 upon successful retrieval of orders', async () => {
        const mockOrders = [{ id: 1 }, { id: 2 }];

        // Mock the first populate to return an object with a second populate
        const secondPopulate = jest.fn().mockResolvedValueOnce(mockOrders);
        const firstPopulate = jest.fn(() => ({
            populate: secondPopulate,
        }));

        orderModel.find = jest.fn(() => ({
            populate: firstPopulate,
        }));

        await getOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalledWith({ buyer: req.user._id });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    it('should return 500 if error is thrown while retrieving orders', async () => {
        // Mock the first populate to return an object with a second populate
        const secondPopulate = jest.fn().mockRejectedValueOnce();
        const firstPopulate = jest.fn(() => ({
            populate: secondPopulate,
        }));

        orderModel.find = jest.fn(() => ({
            populate: firstPopulate,
        }));

        await getOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.any(String),
            })
        );
    });
});

describe('getAllOrdersController', () => {
    let req, res;
    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn(() => res),
            json: jest.fn(),
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 upon successful retrieval of all orders', async () => {
        const mockOrders = [{ id: 1 }, { id: 2 }];

        const sortMock = jest.fn().mockResolvedValueOnce(mockOrders);
        const secondPopulate = jest.fn(() => ({
            sort: sortMock,
        }));
        const firstPopulate = jest.fn(() => ({
            populate: secondPopulate,
        }));

        orderModel.find = jest.fn(() => ({
            populate: firstPopulate,
        }));

        await getAllOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    it('should return 500 if error is thrown while retrieving all orders', async () => {
        const sortMock = jest.fn().mockRejectedValueOnce();
        const secondPopulate = jest.fn(() => ({
            sort: sortMock,
        }));
        const firstPopulate = jest.fn(() => ({
            populate: secondPopulate,
        }));

        orderModel.find = jest.fn(() => ({
            populate: firstPopulate,
        }));

        await getAllOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.any(String),
            })
        );
    });
});

describe('orderStatusController', () => {
    let req, res;
    beforeEach(() => {
        req = {
            params: {
                orderId: 'orderId1',
            },
            body: {
                status: 'pending',
            },
        };

        res = {
            status: jest.fn(() => res),
            json: jest.fn(),
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 upon successful retrieval of order status', async () => {
        const mockOrders = [{ id: 1 }, { id: 2 }];

        orderModel.findByIdAndUpdate = jest.fn(() => mockOrders);

        await orderStatusController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    it('should return 500 if error is thrown while retrieving order status', async () => {
        orderModel.findByIdAndUpdate = jest.fn().mockRejectedValueOnce();

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

describe('updateProfileController', () => {
    let req, res;
    beforeEach(() => {
        req = {
            body: {
                name: 'user1',
                email: 'user1@gmail.com',
                password: 'user1password',
                address: 'CLB at NUS',
                phone: 91231234,
            },
            user: {
                _id: 'user1ID',
            },
        };

        res = {
            json: jest.fn(),
            status: jest.fn(() => res),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 200 upon successful profile creation', async () => {
        userModel.findById = jest.fn().mockResolvedValueOnce({
            name: req.body.user,
            password: req.body.password,
            phone: req.body.phone,
            address: req.body.address,
        });
        userModel.findByIdAndUpdate = jest.fn().mockResolvedValueOnce({});

        await updateProfileController(req, res);

        expect(userModel.findById).toHaveBeenCalledWith(req.user._id);
        expect(authHelper.hashPassword).toHaveBeenCalledWith(req.body.password);
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            req.user._id,
            expect.objectContaining({
                name: req.body.name,
                password: req.body.password + 'hash',
                phone: req.body.phone,
                address: req.body.address,
            }),
            { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });

    it('should return 400 if password does not meet requirements', async () => {
        req.body.password = '123'; // invalid length
        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.any(String),
            })
        );
    });

    it('should return 500 if there is server error while updating user profile', async () => {
        userModel.findById = jest.fn().mockRejectedValueOnce();

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
