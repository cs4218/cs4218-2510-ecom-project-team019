import {
    brainTreePaymentController,
    braintreeTokenController,
} from './productController';
import braintree from 'braintree';
import { gateway } from './productController';
import orderModel from '../models/orderModel';

jest.mock('../models/orderModel'); // mock the DB model

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

describe('braintreeTokenController', () => {
    const req = {};
    let res;
    beforeEach(() => {
        res = {
            status: jest.fn(() => res),
            send: jest.fn(),
            json: jest.fn(),
        };
    });
    afterEach(() => {   
        gateway.clientToken.generate = jest.fn()
    })

    it('should send the token when successful', async () => {
        gateway.clientToken.generate = jest.fn((data, callback) => {
            callback(null, { success: true });
        });

        await braintreeTokenController(req, res);

        expect(gateway.clientToken.generate).toHaveBeenCalledWith(
            expect.objectContaining({}),
            expect.any(Function)
        );

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ ok: true })
        );
    });

    it('should return 500 when there is error generating token', async () => {
        const error = 'error message';

        gateway.clientToken.generate = jest.fn((err, callback) => {
            callback(error, { success: false });
        });

        await braintreeTokenController(req, res);

        expect(gateway.clientToken.generate).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ ok: false })
        );
    });

    it('should return 500 when error is thrown', async () => {
        const error = new Error('Unexpected error');

        gateway.clientToken.generate = jest.fn(() => {
            throw error;
        });

        await braintreeTokenController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ ok: false })
        );
    });
});

describe('brainTreePaymentController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                nonce: 'nonce',
                cart: [{ price: 10 }, { price: 20 }],
            },
            user: {
                _id: 'user123',
            },
        };

        res = {
            status: jest.fn(() => res),
            json: jest.fn(),
        };
    });

    afterEach(() => {   
        gateway.transaction.sale = jest.fn()
    })

    it('should return ok=true when transaction is successful', async () => {
        const result = {
            success: true,
        };

        gateway.transaction.sale = jest.fn((data, callback) => {
            callback(null, result);
        });

        orderModel.mockImplementation(() => ({
            save: jest.fn().mockResolvedValueOnce(),
        }));

        await brainTreePaymentController(req, res);

        expect(gateway.transaction.sale).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: '30.00',
                paymentMethodNonce: req.body.nonce,
            }),
            expect.any(Function)
        );

        expect(orderModel).toHaveBeenCalledWith(
            expect.objectContaining({
                products: req.body.cart,
                payment: result,
                buyer: 'user123',
            })
        );

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

    it('should return 400 if nonce or cart is missing', async () => {
        req.body = {}; // simulate missing body

        await brainTreePaymentController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ ok: false })
        );
    });

    it('should return 500 if dbError is thrown when saving order', async () => {
        const dbError = new Error('Database save failed');
        gateway.transaction.sale = jest.fn((data, callback) => {
            callback(null, { success: true });
        });

        orderModel.mockImplementation(() => ({
            save: jest.fn().mockRejectedValueOnce(dbError),
        }));

        await brainTreePaymentController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ ok: false })
        );
    });
});
