import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server'; // (an in-memory MongoDB) so that can test schema without touching a real DB
import {
    getProductController,
    createProductController,
    getSingleProductController,
    updateProductController,
    deleteProductController,
    productFiltersController,
    productCountController,
    productListController,
    searchProductController,
    relatedProductController,
    productCategoryController,
} from './productController';
import Category from '../models/categoryModel.js';
import slugify from 'slugify';
import productModel from '../models/productModel';

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

// ProductController integration tests
describe('Product Controller Integration', () => {
    // Tests the createProductController, getProductController, getSingleProductController,
    // updateProductController, and deleteProductController.
    test('Full CRUD lifecycle', async () => {
        // Setup: create a category for products
        const category1 = await Category.create({
            name: 'cat1',
            slug: slugify('cat1'),
        });
        const category2 = await Category.create({
            name: 'cat2',
            slug: slugify('cat2'),
        });

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // 1. Get products when none exist
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 0,
            message: 'All Products',
            products: [],
        });

        // 2. Create a new product
        const createReq1 = {
            fields: {
                name: 'Test Product',
                description: 'A product for testing',
                price: 20,
                category: category1,
                quantity: 5,
                shipping: true,
            },
            files: {},
        };

        await createProductController(createReq1, res);
        expect(res.status).toHaveBeenCalledWith(201);
        const createdProduct =
            res.json.mock.calls[res.json.mock.calls.length - 1][0].products;
        expect(createdProduct).toMatchObject({
            name: 'Test Product',
            description: 'A product for testing',
            price: 20,
            category: category1,
            quantity: 5,
            shipping: true,
        });

        // 3. Get products again, should have one now
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 1,
            message: 'All Products',
            products: expect.arrayContaining([
                expect.objectContaining({ name: 'Test Product' }),
            ]),
        });

        // 4. Create another product
        const createReq2 = {
            fields: {
                name: 'Second Product',
                description: 'Another product for testing',
                price: 30,
                category: category2,
                quantity: 3,
                shipping: false,
            },
            files: {},
        };
        await createProductController(createReq2, res);
        expect(res.status).toHaveBeenCalledWith(201);
        const secondProduct =
            res.json.mock.calls[res.json.mock.calls.length - 1][0].products;
        expect(secondProduct).toMatchObject({
            name: 'Second Product',
            description: 'Another product for testing',
            price: 30,
            category: category2,
            quantity: 3,
            shipping: false,
        });

        // 5. Get single product by slug
        const getSingleReq = { params: { slug: createdProduct.slug } };
        await getSingleProductController(getSingleReq, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Single product fetched',
            product: expect.objectContaining({ name: 'Test Product' }),
        });

        // 6. Get products again, should have two now
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 2,
            message: 'All Products',
            products: expect.arrayContaining([
                expect.objectContaining({ name: 'Test Product' }),
                expect.objectContaining({ name: 'Second Product' }),
            ]),
        });

        // 7. Update the first product
        const updateReq = {
            params: { pid: createdProduct._id },
            fields: {
                name: 'Updated Product',
                description: 'Updated description',
                price: 25,
                category: category2,
                quantity: 10,
                shipping: false,
            },
            files: {},
        };

        await updateProductController(updateReq, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Product updated successfully',
            products: expect.objectContaining({
                name: 'Updated Product',
                description: 'Updated description',
                price: 25,
                category: category2._id,
                quantity: 10,
                shipping: false,
            }),
        });

        // 8. Delete the second product
        const deleteReq = { params: { pid: secondProduct._id } };
        await deleteProductController(deleteReq, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Product deleted successfully',
        });

        // 9. Get products again, should have one now
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 1,
            message: 'All Products',
            products: expect.arrayContaining([
                expect.objectContaining({ name: 'Updated Product' }),
            ]),
        });
    });

    // Tests for productFiltersController, productCountController,
    // productListController, searchProductController,
    // relatedProductController, productCategoryController
    test('Additional product queries', async () => {
        // Setup: create a category for products
        const category1 = await Category.create({
            name: 'cat1',
            slug: slugify('cat1'),
        });
        const category2 = await Category.create({
            name: 'cat2',
            slug: slugify('cat2'),
        });

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // 1. Get products when none exist
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 0,
            message: 'All Products',
            products: [],
        });

        // 2. Create 10 products (odd indexed in category1, even in category2)
        for (let i = 1; i <= 10; i++) {
            const createReq = {
                fields: {
                    name: `Product ${i}`,
                    description: `Description for product ${i}`,
                    price: i * 10,
                    category: i % 2 === 0 ? category2 : category1,
                    quantity: i,
                    shipping: i % 2 === 0,
                },
                files: {},
            };
            await createProductController(createReq, res);
            expect(res.status).toHaveBeenCalledWith(201);
        }

        // 3. Get products again, should have 10 now
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 10,
            message: 'All Products',
            products: expect.any(Array),
        });

        // 4. Get products filtered by category1
        const filterReq1 = {
            body: { checked: [category1._id.toString()], radio: [] },
        };
        await productFiltersController(filterReq1, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            products: expect.arrayContaining([
                expect.objectContaining({ category: category1._id }),
            ]),
        });

        // 5. Get products filtered by price range (20 to 70)
        const filterReq2 = {
            body: { checked: [], radio: [20, 70] },
        };
        await productFiltersController(filterReq2, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            products: expect.arrayContaining([
                expect.objectContaining({ price: expect.any(Number) }),
            ]),
        });

        // 6. Get total product count
        await productCountController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            total: 10,
            message: 'Product count fetched',
        });

        // 7. Get products for page 2 (page size 6)
        const listReq = { params: { page: 2 } };
        await productListController(listReq, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            products: expect.any(Array),
        });
        // Should return 4 products on page 2
        expect(
            res.json.mock.calls[res.json.mock.calls.length - 1][0].products
                .length
        ).toBe(4);

        // 8. Search products with keyword "Product 1"
        const searchReq = { params: { keyword: 'Product 1' } };
        await searchProductController(searchReq, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ name: 'Product 1' }),
                expect.objectContaining({ name: 'Product 10' }),
            ])
        );

        // 9. Get related products for "Product 1" (should be in category1)
        const prod1 = await productModel.findOne({ name: 'Product 1' }).exec();
        const relatedReq = { params: { pid: prod1._id, cid: category1._id } };
        await relatedProductController(relatedReq, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            products: expect.arrayContaining([
                expect.objectContaining({ category: category1._id }),
            ]),
        });
        // Should not include the original product
        const relatedProducts =
            res.json.mock.calls[res.json.mock.calls.length - 1][0].products;
        relatedProducts.forEach((p) => {
            expect(p._id.toString()).not.toBe(prod1._id.toString());
        });
        // Should return at most 3 related products
        expect(relatedProducts.length).toBeLessThanOrEqual(3);

        // 10. Get products by category1 slug
        const catReq = { params: { slug: category1.slug } };
        await productCategoryController(catReq, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            category: expect.objectContaining({ name: 'cat1' }),
            products: expect.arrayContaining([
                expect.objectContaining({
                    category: expect.objectContaining({ name: 'cat1' }),
                }),
            ]),
        });
        // All returned products should belong to category1
        const catProducts =
            res.json.mock.calls[res.json.mock.calls.length - 1][0].products;
        catProducts.forEach((p) => {
            expect(p.category._id.toString()).toBe(category1._id.toString());
        });
        // Should return 5 products in category1
        expect(catProducts.length).toBe(5);
    });
});

describe('Product controller integration errors', () => {
    it('Creation fail should not change the number of products', async () => {
        // Setup: create a category for products
        const category1 = await Category.create({
            name: 'cat1',
            slug: slugify('cat1'),
        });
        const category2 = await Category.create({
            name: 'cat2',
            slug: slugify('cat2'),
        });

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // 1. Get products when none exist
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 0,
            message: 'All Products',
            products: [],
        });

        // 2. Create 10 products successfully (odd indexed in category1, even in category2)
        for (let i = 1; i <= 10; i++) {
            const createReq = {
                fields: {
                    name: `Product ${i}`,
                    description: `Description for product ${i}`,
                    price: i * 10,
                    category: i % 2 === 0 ? category2 : category1,
                    quantity: i,
                    shipping: i % 2 === 0,
                },
                files: {},
            };
            await createProductController(createReq, res);
            expect(res.status).toHaveBeenCalledWith(201);
        }

        // 3. There should be 10 products
        await productCountController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            total: 10,
            message: 'Product count fetched',
        });

        // 4. Try inserting another product with missing fields
        const createReqFail = {
            fields: {
                name: `Product Fail`,
                description: `Description for product fail`,
                category: category2,
                quantity: 1,
            },
            files: {},
        };
        await createProductController(createReqFail, res);
        expect(res.status).toHaveBeenCalledWith(400);

        // 5. There should still be 10 products
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 10,
            message: 'All Products',
            products: expect.arrayContaining([
                expect.objectContaining({ name: 'Product 1' }),
                expect.objectContaining({ name: 'Product 10' }),
                expect.not.objectContaining({ name: 'Product Fail' }),
            ]),
        });
    });

    it('Updating fail should not update the product list', async () => {
        // Setup: create a category for products
        const category1 = await Category.create({
            name: 'cat1',
            slug: slugify('cat1'),
        });
        const category2 = await Category.create({
            name: 'cat2',
            slug: slugify('cat2'),
        });

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        // 1. Get products when none exist
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 0,
            message: 'All Products',
            products: [],
        });

        // 2. Create 10 products successfully (odd indexed in category1, even in category2)
        for (let i = 1; i <= 10; i++) {
            const createReq = {
                fields: {
                    name: `Product ${i}`,
                    description: `Description for product ${i}`,
                    price: i * 10,
                    category: i % 2 === 0 ? category2 : category1,
                    quantity: i,
                    shipping: i % 2 === 0,
                },
                files: {},
            };
            await createProductController(createReq, res);
            expect(res.status).toHaveBeenCalledWith(201);
        }

        // 3. There should be 10 products
        await productCountController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            total: 10,
            message: 'Product count fetched',
        });

        // 4. Try updating a product that doesn't exist
        const updateReqFail = {
            params: { pid: 'not-a-valid-objectid' },
            fields: {
                name: 'Fail updated Product',
                description: 'Fail updated description',
                price: 25,
                category: category2,
                quantity: 10,
                shipping: false,
            },
            files: {},
        };
        await updateProductController(updateReqFail, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        consoleSpy.mockRestore();

        // 5. There should still be 10 products
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 10,
            message: 'All Products',
            products: expect.arrayContaining([
                expect.objectContaining({ name: 'Product 1' }),
                expect.objectContaining({ name: 'Product 10' }),
                expect.not.objectContaining({ name: 'Fail updated Product' }),
            ]),
        });

        // 6. Try updating a product that exists but fails validation
        const product4 = await productModel.findOne({ name: 'Product 4' });
        const updateReqFail2 = {
            params: { pid: product4._id },
            fields: {
                name: 'Fail updated Product',
                description: 'Fail updated description',
                category: null,
                quantity: 10,
                shipping: false,
            },
            files: {},
        };
        await updateProductController(updateReqFail2, res);
        expect(res.status).toHaveBeenCalledWith(400);

        // 7. There should still be 10 products
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 10,
            message: 'All Products',
            products: expect.arrayContaining([
                expect.objectContaining({ name: 'Product 1' }),
                expect.objectContaining({ name: 'Product 4' }),
                expect.not.objectContaining({ name: 'Fail updated Product' }),
            ]),
        });
        const p4After = await productModel.findById(product4._id);
        expect(p4After.name).toBe('Product 4');
    });
});
