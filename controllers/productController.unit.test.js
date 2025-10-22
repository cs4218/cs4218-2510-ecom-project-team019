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
import braintree from 'braintree';
import { gateway, getProductController } from './productController';
import orderModel from '../models/orderModel';
import productModel from '../models/productModel';
import categoryModel from '../models/categoryModel';
import { skip } from 'node:test';
import fs from 'fs';

jest.mock('fs');

jest.mock('../models/orderModel'); // mock the DB model

jest.mock('../models/categoryModel', () => ({
    findOne: jest.fn().mockReturnThis(),
}));

jest.mock('../models/productModel', () => {
    const mockFind = jest.fn().mockReturnThis();
    const mockFindOne = jest.fn().mockReturnThis();
    const mockFindById = jest.fn().mockReturnThis();
    const mockFindByIdAndUpdate = jest.fn();
    const mockFindByIdAndDelete = jest.fn();
    const mockFindOneAndUpdate = jest.fn();
    const mockCreate = jest.fn();
    const mockPopulate = jest.fn().mockReturnThis();
    const mockSelect = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockReturnThis();
    const mockSkip = jest.fn().mockReturnThis();
    const mockSort = jest.fn().mockReturnThis();
    const mockExec = jest.fn();
    const mockEstimatedDocumentCount = jest.fn();

    const mockConstructor = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValueOnce(true),
        photo: {},
    }));

    // Attach static/chainable methods directly to the constructor
    mockConstructor.find = mockFind;
    mockConstructor.findOne = mockFindOne;
    mockConstructor.findById = mockFindById;
    mockConstructor.findByIdAndUpdate = mockFindByIdAndUpdate;
    mockConstructor.findByIdAndDelete = mockFindByIdAndDelete;
    mockConstructor.findOneAndUpdate = mockFindOneAndUpdate;
    mockConstructor.create = mockCreate;
    mockConstructor.populate = mockPopulate;
    mockConstructor.select = mockSelect;
    mockConstructor.limit = mockLimit;
    mockConstructor.skip = mockSkip;
    mockConstructor.sort = mockSort;
    mockConstructor.exec = mockExec;
    mockConstructor.estimatedDocumentCount = mockEstimatedDocumentCount;

    return mockConstructor;
});

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
        gateway.clientToken.generate = jest.fn();
    });

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
        gateway.transaction.sale = jest.fn();
    });

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

        orderModel.create = jest.fn().mockResolvedValueOnce()

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

        orderModel.create = jest.fn().mockRejectedValueOnce(dbError)

        await brainTreePaymentController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ ok: false })
        );
    });
});

describe('getProductController', () => {
    const req = {};
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all products successfully', async () => {
        const fakeProducts = [
            { _id: '1', name: 'Prod1' },
            { _id: '2', name: 'Prod2' },
        ];

        productModel.find.mockReturnThis();
        productModel.populate.mockReturnThis();
        productModel.select.mockReturnThis();
        productModel.limit.mockReturnThis();
        productModel.sort.mockResolvedValue(fakeProducts);

        await getProductController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: fakeProducts.length,
            message: 'All Products',
            products: fakeProducts,
        });
    });

    it('should handle errors properly', async () => {
        productModel.find.mockReturnThis();
        productModel.populate.mockReturnThis();
        productModel.select.mockReturnThis();
        productModel.limit.mockReturnThis();
        productModel.sort.mockRejectedValueOnce(new Error('DB fail'));

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await getProductController(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('DB fail'));
        consoleSpy.mockRestore();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error in getting products',
            error: 'DB fail',
        });
    });
});

describe('getSingleProductController', () => {
    const req = {
        params: { slug: 'test-slug' },
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the correct slug successfully', async () => {
        const fakeProduct = { _id: '1', slug: 'test-slug', name: 'Prod1' };

        productModel.findOne.mockReturnThis();
        productModel.select.mockReturnThis();
        productModel.populate.mockResolvedValueOnce(fakeProduct);

        await getSingleProductController(req, res);

        expect(productModel.findOne).toHaveBeenCalledWith({
            slug: 'test-slug',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Single product fetched',
            product: fakeProduct,
        });
    });

    it('should fail if single product does not exist', async () => {
        productModel.findOne.mockReturnThis();
        productModel.select.mockReturnThis();
        productModel.populate.mockResolvedValueOnce(null);

        await getSingleProductController(req, res);

        expect(productModel.findOne).toHaveBeenCalledWith({
            slug: 'test-slug',
        });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Product not found',
        });
    });

    it('should handle errors properly', async () => {
        productModel.findOne.mockReturnThis();
        productModel.select.mockReturnThis();
        productModel.populate.mockRejectedValueOnce(new Error('DB fail'));

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await getSingleProductController(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('DB fail'));
        consoleSpy.mockRestore();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error while getting single product',
            error: 'DB fail',
        });
    });
});

describe('productPhotoController', () => {
    const req = {
        params: { pid: '1' },
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        set: jest.fn(),
        send: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the correct photo successfully', async () => {
        const fakeProduct = {
            _id: '1',
            slug: 'test-slug',
            photo: { data: 'image data', contentType: 'image/png' },
            name: 'Prod1',
        };

        productModel.findById.mockReturnThis();
        productModel.select.mockResolvedValueOnce(fakeProduct);

        await productPhotoController(req, res);

        expect(productModel.findById).toHaveBeenCalledWith('1');
        expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/png');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith('image data');
    });

    it('should 404 when product not found', async () => {
        productModel.findById.mockReturnThis();
        productModel.select.mockResolvedValueOnce(null);

        await productPhotoController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Photo not found');
    });

    it('should 404 when product exists but photo not found', async () => {
        productModel.findById.mockReturnThis();
        productModel.select.mockResolvedValueOnce({ _id: '1', photo: {} });

        await productPhotoController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Photo not found');
    });

    it('should handle errors properly', async () => {
        productModel.findById.mockReturnThis();
        productModel.select.mockRejectedValueOnce(new Error('DB fail'));

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await productPhotoController(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('DB fail'));
        consoleSpy.mockRestore();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Internal Server Error');
    });
});

describe('productFiltersController', () => {
    const req = {
        body: { checked: ['cat1', 'cat2'], radio: [10, 50] },
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return filtered products successfully', async () => {
        const fakeProducts = [
            { _id: '1', name: 'test 1' },
            { _id: '2', name: 'test 2' },
        ];

        productModel.find.mockResolvedValue(fakeProducts);

        await productFiltersController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({
            category: ['cat1', 'cat2'],
            price: { $gte: 10, $lte: 50 },
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            products: fakeProducts,
        });
    });

    it('should return filtered products successfully with no radio inputs', async () => {
        const fakeProducts = [
            { _id: '1', name: 'test 1' },
            { _id: '2', name: 'test 2' },
        ];

        const reqNoRadio = { body: { checked: ['cat1', 'cat2'], radio: [] } };

        productModel.find.mockResolvedValue(fakeProducts);

        await productFiltersController(reqNoRadio, res);

        expect(productModel.find).toHaveBeenCalledWith({
            category: ['cat1', 'cat2'],
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            products: fakeProducts,
        });
    });

    it('should return filtered products successfully with no category inputs', async () => {
        const fakeProducts = [
            { _id: '1', name: 'test 1' },
            { _id: '2', name: 'test 2' },
        ];

        const reqNoCategory = { body: { checked: [], radio: [10, 50] } };

        productModel.find.mockResolvedValue(fakeProducts);

        await productFiltersController(reqNoCategory, res);

        expect(productModel.find).toHaveBeenCalledWith({
            price: { $gte: 10, $lte: 50 },
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            products: fakeProducts,
        });
    });

    it('should return filtered products successfully with no radio or category inputs', async () => {
        const reqNoInput = { body: { checked: [], radio: [] } };

        productModel.find.mockResolvedValue([]);

        await productFiltersController(reqNoInput, res);

        expect(productModel.find).toHaveBeenCalledWith({});

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            products: [],
        });
    });

    it('should handle errors properly', async () => {
        productModel.find.mockRejectedValueOnce(new Error('DB fail'));

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await productFiltersController(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('DB fail'));
        consoleSpy.mockRestore();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error while filtering products',
            error: 'DB fail',
        });
    });
});

describe('productCountController', () => {
    const req = {};
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return product count successfully', async () => {
        productModel.find.mockReturnThis();
        productModel.estimatedDocumentCount.mockResolvedValueOnce(2);

        await productCountController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            total: 2,
            message: 'Product count fetched',
        });
    });

    it('should handle errors properly', async () => {
        productModel.find.mockReturnThis();
        productModel.estimatedDocumentCount.mockRejectedValueOnce(
            new Error('DB fail')
        );

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await productCountController(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('DB fail'));
        consoleSpy.mockRestore();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error in getting product count',
            error: 'DB fail',
        });
    });
});

describe('productListController', () => {
    const req = {
        params: { page: 2 },
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch page by skipping the correct number of entries', async () => {
        await productListController(req, res);

        expect(productModel.skip).toHaveBeenCalledWith(6); // (2-1) * 6
        expect(productModel.limit).toHaveBeenCalledWith(6); // 6
    });

    it('should return products by page successfully', async () => {
        const fakeProducts = [...Array(13).keys()].map((i) => ({
            _id: `${i + 1}`,
            name: `Product ${i + 1}`,
        }));

        productModel.find.mockReturnThis();
        productModel.select.mockReturnThis();
        productModel.skip.mockReturnThis();
        productModel.limit.mockReturnThis();
        productModel.sort.mockResolvedValue(fakeProducts.slice(6, 12)); // page 2

        await productListController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            products: fakeProducts.slice(6, 12),
        });
    });

    it('should handle errors properly', async () => {
        productModel.find.mockReturnThis();
        productModel.select.mockReturnThis();
        productModel.skip.mockReturnThis();
        productModel.limit.mockReturnThis();
        productModel.sort.mockRejectedValueOnce(new Error('DB fail'));

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await productListController(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('DB fail'));
        consoleSpy.mockRestore();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error in getting products by page',
            error: 'DB fail',
        });
    });
});

describe('searchProductController', () => {
    const req = {
        params: { keyword: 'test' },
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return searched products successfully', async () => {
        const fakeProducts = [
            { _id: '1', name: 'test 1' },
            { _id: '2', name: 'test 2' },
        ];

        productModel.find.mockReturnThis();
        productModel.select.mockResolvedValue(fakeProducts);

        await searchProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(fakeProducts);
    });

    it('should handle errors properly', async () => {
        productModel.find.mockReturnThis();
        productModel.select.mockRejectedValueOnce(new Error('DB fail'));

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await searchProductController(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('DB fail'));
        consoleSpy.mockRestore();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error in Search Product API',
            error: 'DB fail',
        });
    });
});

describe('relatedProductController', () => {
    const req = {
        params: { pid: '1', cid: '1' },
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return related products successfully', async () => {
        const fakeProducts = [
            {
                _id: '1',
                name: 'test 1',
                category: { _id: '1', name: 'cat1', slug: 'cat1' },
            },
            {
                _id: '2',
                name: 'test 2',
                category: { _id: '1', name: 'cat1', slug: 'cat1' },
            },
            {
                _id: '3',
                name: 'test 3',
                category: { _id: '1', name: 'cat1', slug: 'cat1' },
            },
        ];

        const filteredProducts = fakeProducts.filter((p) => p._id !== '1');

        productModel.find.mockReturnThis();
        productModel.select.mockReturnThis();
        productModel.limit.mockReturnThis();
        productModel.populate.mockResolvedValue(filteredProducts);

        await relatedProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            products: filteredProducts,
        });
    });

    it('should handle errors properly', async () => {
        productModel.find.mockReturnThis();
        productModel.select.mockReturnThis();
        productModel.limit.mockReturnThis();
        productModel.populate.mockRejectedValueOnce(new Error('DB fail'));

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await relatedProductController(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('DB fail'));
        consoleSpy.mockRestore();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error while getting related product',
            error: 'DB fail',
        });
    });
});

describe('productCategoryController', () => {
    const req = {
        params: { slug: 'cat1' },
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return products and categories successfully', async () => {
        const fakeCategories = [
            { _id: '1', name: 'cat1', slug: 'cat1' },
            { _id: '2', name: 'cat2', slug: 'cat2' },
        ];

        const fakeProducts = [
            {
                _id: '1',
                name: 'test 1',
                category: { _id: '1', name: 'cat1', slug: 'cat1' },
            },
            {
                _id: '2',
                name: 'test 2',
                category: { _id: '1', name: 'cat1', slug: 'cat1' },
            },
            {
                _id: '3',
                name: 'test 3',
                category: { _id: '2', name: 'cat2', slug: 'cat2' },
            },
        ];

        const filteredProducts = fakeProducts.filter(
            (p) => p.category._id === '1'
        );

        categoryModel.findOne.mockResolvedValue(fakeCategories[0]);

        productModel.find.mockReturnThis();
        productModel.populate.mockResolvedValue(filteredProducts);

        await productCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            category: fakeCategories[0],
            products: filteredProducts,
        });
    });

    it('should handle errors properly', async () => {
        productModel.find.mockReturnThis();
        productModel.populate.mockRejectedValueOnce(new Error('DB fail'));

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await productCategoryController(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('DB fail'));
        consoleSpy.mockRestore();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error while getting products by category',
            error: 'DB fail',
        });
    });
});

describe('createProductController', () => {
    const req = {
        fields: {
            name: 'a',
            description: 'b',
            price: 10,
            category: 'cat1',
            quantity: 1,
            shipping: true,
        },
        files: {
            photo: { size: 500000, path: 'path/to/photo', type: 'image/png' },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    it('should return an error if name is missing', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingName = { ...req, fields: { ...req.fields, name: '' } };
        await createProductController(reqMissingName, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Name is required',
        });
    });

    it('should return an error if description is missing', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingDescription = {
            ...req,
            fields: { ...req.fields, description: '' },
        };
        await createProductController(reqMissingDescription, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Description is required',
        });
    });

    it('should return an error if price is missing', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingPrice = {
            ...req,
            fields: { ...req.fields, price: undefined },
        };
        await createProductController(reqMissingPrice, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Price is required',
        });
    });

    it('should return an error if category is missing', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingCategory = {
            ...req,
            fields: { ...req.fields, category: '' },
        };
        await createProductController(reqMissingCategory, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Category is required',
        });
    });

    it('should return an error if quantity is missing', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingQuantity = {
            ...req,
            fields: { ...req.fields, quantity: undefined },
        };
        await createProductController(reqMissingQuantity, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Quantity is required',
        });
    });

    it('should return an error if shipping is missing', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingShipping = {
            ...req,
            fields: { ...req.fields, shipping: undefined },
        };
        await createProductController(reqMissingShipping, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Shipping is required',
        });
    });

    it('should return an error if photo is more than 1MB', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingPhoto = {
            ...req,
            files: { photo: { ...req.files.photo, size: 2000000 } },
        };
        await createProductController(reqMissingPhoto, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Photo provided should be less than 1MB',
        });
    });

    it('should create product if all fields provided', async () => {
        productModel.findOne.mockResolvedValue(null);
        const product = {
            _id: '1',
            name: 'a',
            description: 'b',
            price: 10,
            quantity: 1,
            category: 'cat1',
            shipping: true,
            photo: { data: 'image data', contentType: 'image/png' },
        };

        jest.spyOn(fs, 'readFileSync').mockImplementation((path) => {
            return 'image data';
        });

        productModel.mockImplementation(() => ({
            ...product,
            photo: {},
            save: jest.fn().mockResolvedValueOnce(product),
        }));

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Product created successfully',
            products: expect.objectContaining({ ...product }),
        });
    });

    it('should create product if photo not provided', async () => {
        productModel.findOne.mockResolvedValue(null);
        const product = {
            _id: '1',
            name: 'a',
            description: 'b',
            price: 10,
            quantity: 1,
            category: 'cat1',
            shipping: true,
        };

        const reqMissingImage = {
            ...req,
            files: {},
        };

        productModel.mockImplementation(() => ({
            ...product,
            photo: {},
            save: jest.fn().mockResolvedValueOnce(product),
        }));

        await createProductController(reqMissingImage, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Product created successfully',
            products: expect.objectContaining({ ...product }),
        });
    });

    it('should handle errors properly', async () => {
        productModel.findOne.mockResolvedValue(null);
        productModel.mockImplementation(() => {
            throw new Error('DB fail');
        });
        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await createProductController(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('DB fail'));
        consoleSpy.mockRestore();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error while creating product',
            error: 'DB fail',
        });
    });

    it('should return 409 if duplicate product is found', async () => {
        // oh no! duplicate product is found
        productModel.findOne.mockResolvedValue({
            _id: '0',
        });

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Product already exists',
        });
    });
});

describe('updateProductController', () => {
    const req = {
        params: { pid: '1' },
        fields: {
            name: 'a',
            description: 'b',
            price: 10,
            category: 'cat1',
            quantity: 1,
            shipping: true,
        },
        files: {
            photo: { size: 500000, path: 'path/to/photo', type: 'image/png' },
        },
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an error if name is missing', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingName = { ...req, fields: { ...req.fields, name: '' } };
        await updateProductController(reqMissingName, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Name is required',
        });
    });

    it('should return an error if description is missing', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingDescription = {
            ...req,
            fields: { ...req.fields, description: '' },
        };
        await updateProductController(reqMissingDescription, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Description is required',
        });
    });

    it('should return an error if price is missing', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingPrice = {
            ...req,
            fields: { ...req.fields, price: undefined },
        };
        await updateProductController(reqMissingPrice, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Price is required',
        });
    });

    it('should return an error if category is missing', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingCategory = {
            ...req,
            fields: { ...req.fields, category: '' },
        };
        await updateProductController(reqMissingCategory, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Category is required',
        });
    });

    it('should return an error if quantity is missing', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingQuantity = {
            ...req,
            fields: { ...req.fields, quantity: undefined },
        };
        await updateProductController(reqMissingQuantity, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Quantity is required',
        });
    });

    it('should return an error if shipping is missing', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingShipping = {
            ...req,
            fields: { ...req.fields, shipping: undefined },
        };
        await updateProductController(reqMissingShipping, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Shipping is required',
        });
    });

    it('should return an error if photo is more than 1MB', async () => {
        productModel.findOne.mockResolvedValue(null);
        const reqMissingPhoto = {
            ...req,
            files: { photo: { ...req.files.photo, size: 2000000 } },
        };
        await updateProductController(reqMissingPhoto, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Photo provided should be less than 1MB',
        });
    });

    it('should update product if all fields provided', async () => {
        productModel.findOne.mockResolvedValue(null);
        const product = {
            _id: '1',
            name: 'a',
            description: 'b',
            price: 10,
            quantity: 1,
            category: 'cat1',
            shipping: true,
            photo: { data: 'image data', contentType: 'image/png' },
        };

        jest.spyOn(fs, 'readFileSync').mockImplementation((path) => {
            return 'image data';
        });

        productModel.findByIdAndUpdate.mockResolvedValueOnce({
            ...product,
            photo: {},
            save: jest.fn().mockResolvedValueOnce(product),
        });

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Product updated successfully',
            products: expect.objectContaining({ ...product }),
        });
    });

    it('should update product if photo not provided', async () => {
        productModel.findOne.mockResolvedValue(null);
        const product = {
            _id: '1',
            name: 'a',
            description: 'b',
            price: 10,
            quantity: 1,
            category: 'cat1',
            shipping: true,
        };

        const reqMissingImage = {
            ...req,
            files: {},
        };

        productModel.findByIdAndUpdate.mockResolvedValueOnce({
            ...product,
            save: jest.fn().mockResolvedValueOnce(product),
        });

        await updateProductController(reqMissingImage, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Product updated successfully',
            products: expect.objectContaining({ ...product }),
        });
    });

    it('should handle errors properly', async () => {
        productModel.findOne.mockResolvedValue(null);
        productModel.findByIdAndUpdate.mockRejectedValueOnce(
            new Error('DB fail')
        );
        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await updateProductController(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('DB fail'));
        consoleSpy.mockRestore();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error while updating product',
            error: 'DB fail',
        });
    });

    it('should return 409 if duplicate product found and is not the same product', async () => {
        // oh no! duplicate product is found
        productModel.findOne.mockResolvedValue({
            _id: '0',
        });

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'A product with this name already exists',
        });
    });

    it('should update successfully if product name is the same', async () => {
        const req2 = {
            params: { pid: '0' },
            fields: {
                name: 'A',
                description: 'b',
                price: 10,
                category: 'cat1',
                quantity: 1,
                shipping: true,
            },
            files: {},
        };

        const product = {
            _id: '0',
            name: 'A',
            description: 'b',
            price: 10,
            category: 'cat1',
            quantity: 1,
            shipping: true,
        };

        // product to update already exists in the database
        productModel.findOne.mockResolvedValue(product);

        productModel.findByIdAndUpdate.mockResolvedValueOnce({
            ...product,
            photo: {},
            save: jest.fn().mockResolvedValueOnce(product),
        });

        await updateProductController(req2, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Product updated successfully',
            products: expect.objectContaining({ ...product }),
        });
    });

    it('should return 404 if product to update does not exist', async () => {
        const req2 = {
            params: { pid: '0' },
            fields: {
                name: 'A',
                description: 'b',
                price: 10,
                category: 'cat1',
                quantity: 1,
                shipping: true,
            },
            files: {},
        };

        productModel.findOne.mockResolvedValue(null);

        // product to update already does not exist
        productModel.findByIdAndUpdate.mockResolvedValueOnce(null);

        await updateProductController(req2, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Product not found',
        });
    });
});

describe('deleteProductController', () => {
    const req = {
        params: { pid: '1' },
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete product properly', async () => {
        productModel.findByIdAndDelete.mockReturnThis();
        productModel.select.mockResolvedValueOnce({ _id: '1', name: 'prod1' });

        await deleteProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Product deleted successfully',
        });
    });

    it('should handle errors properly', async () => {
        productModel.findByIdAndDelete.mockReturnThis();
        productModel.select.mockRejectedValueOnce(new Error('DB fail'));

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await deleteProductController(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('DB fail'));
        consoleSpy.mockRestore();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error while deleting product',
            error: 'DB fail',
        });
    });
});
