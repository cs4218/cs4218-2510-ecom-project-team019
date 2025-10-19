import {
    brainTreePaymentController,
    braintreeTokenController,
    getSingleProductController,
    productPhotoController,
    productCountController,
    searchProductController,
    relatedProductController,
    productCategoryController,
    productListController,
    createProductController,
    updateProductController,
    deleteProductController,
    productFiltersController,
} from './productController';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { gateway, getProductController } from './productController';
import orderModel from '../models/orderModel';

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

describe('integration test: brainTreePaymentController', () => {
    let mongoServer, req, res;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(() => {
        req = {
            body: {
                nonce: 'nonce',
                cart: [{ price: 10 }, { price: 20 }],
            },
            user: {
                _id: new mongoose.Types.ObjectId(),
            },
        };

        res = {
            status: jest.fn(() => res),
            json: jest.fn(),
        };
    });

    afterEach(async () => {
        await orderModel.deleteMany({});
        jest.clearAllMocks();
    });

    it('should return ok=true when transaction is successful', async () => {
        const result = {
            success: true,
        };

        gateway.transaction.sale = jest.fn((data, callback) => {
            callback(null, result);
        });

        await brainTreePaymentController(req, res);

        // Verify that an Order has been created and saved into DB
        const newOrder = await orderModel.findOne({ buyer: req.user._id });
        expect(newOrder).toBeTruthy();
        expect(newOrder.products).toHaveLength(2);
        expect(newOrder.payment).toEqual(result);

        expect(gateway.transaction.sale).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: '30.00',
                paymentMethodNonce: req.body.nonce,
            }),
            expect.any(Function)
        );

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                ok: true,
            })
        );
    });

    it('should return 500 if transaction fails', async () => {
        gateway.transaction.sale = jest.fn((data, callback) => {
            callback(null, { success: false, message: 'Payment failed' });
        });

        await brainTreePaymentController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ ok: false })
        );
    });

    it('should return 500 if dbError is thrown when saving order', async () => {
        const dbError = new Error('Database save failed');
        gateway.transaction.sale = jest.fn((data, callback) => {
            callback(null, { success: true });
        });

        jest.spyOn(orderModel, 'create').mockRejectedValueOnce(dbError);

        await brainTreePaymentController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ ok: false })
        );
    });

    it('should return 500 if the payment gateway throws an error', async () => {
        gateway.transaction.sale = jest.fn((data, callback) => {
            callback(new Error('Gateway timeout'));
        });

        await brainTreePaymentController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                ok: false,
                error: 'Gateway timeout',
            })
        );
    });
});
