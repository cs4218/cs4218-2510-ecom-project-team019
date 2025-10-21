/**
 * Integration tests for cross-module integration between
 * Category and Product controllers.
 */
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
import {
    createCategoryController,
    updateCategoryController,
    categoryController,
    singleCategoryController,
    deleteCategoryController,
} from './categoryController';
import Category from '../models/categoryModel.js';
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

describe('CategoryController-ProductController integration', () => {
    it('initial state should contain 0 products and categories', async () => {
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
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

        // 2. Get categories when none exist
        await categoryController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: 'All Categories List',
            category: [],
        });
    });

    it('should create and get products properly', async () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };

        // 1. Create 2 categories
        for (let i = 1; i <= 2; i++) {
            await createCategoryController(
                {
                    body: {
                        name: `Category ${i}`,
                    },
                },
                res
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'New category created',
                category: expect.objectContaining({ name: `Category ${i}` }),
            });
        }

        // 2. Create `Category 1` again and ensure it fails
        await createCategoryController(
            {
                body: {
                    name: `Category 1`,
                },
            },
            res
        );
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: 'Category already exists',
        });

        // 3. Ensure category list contains 2 categories
        await categoryController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: 'All Categories List',
            category: [1, 2].map((i) =>
                expect.objectContaining({ name: `Category ${i}` })
            ),
        });

        const categoryIds = res.send.mock.calls[
            res.send.mock.calls.length - 1
        ][0].category.map((x) => x._id);

        // 4. Create 10 products (5 from each category) from the categories
        for (let i = 1; i <= 10; i++) {
            await createProductController(
                {
                    fields: {
                        name: `Product ${i}`,
                        description: `Description of product ${i}`,
                        price: i * 10,
                        category: categoryIds[i % 2],
                        quantity: i * 3,
                        shipping: i % 2 === 0,
                    },
                    files: {},
                },
                res
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Product created successfully',
                products: expect.objectContaining({
                    name: `Product ${i}`,
                    description: `Description of product ${i}`,
                    price: i * 10,
                    category: categoryIds[i % 2],
                    quantity: i * 3,
                    shipping: i % 2 === 0,
                }),
            });
        }

        // 5. Ensure getProductController can get all products
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 10,
            message: 'All Products',
            products: expect.arrayContaining(
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) =>
                    expect.objectContaining({
                        name: `Product ${i}`,
                        description: `Description of product ${i}`,
                        price: i * 10,
                        category: expect.objectContaining({
                            name: `Category ${(i % 2) + 1}`,
                        }),
                        quantity: i * 3,
                        shipping: i % 2 === 0,
                    })
                )
            ),
        });
    });

    it('products should show the correct category if category is updated', async () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };

        // 1. Create 2 categories
        for (let i = 1; i <= 2; i++) {
            await createCategoryController(
                {
                    body: {
                        name: `Category ${i}`,
                    },
                },
                res
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'New category created',
                category: expect.objectContaining({ name: `Category ${i}` }),
            });
        }

        // 2. Ensure category list contains 2 categories
        await categoryController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: 'All Categories List',
            category: [1, 2].map((i) =>
                expect.objectContaining({ name: `Category ${i}` })
            ),
        });

        const categoryIds = res.send.mock.calls[
            res.send.mock.calls.length - 1
        ][0].category.map((x) => x._id);

        // 3. Create 10 products (5 from each category) from the categories
        for (let i = 1; i <= 10; i++) {
            await createProductController(
                {
                    fields: {
                        name: `Product ${i}`,
                        description: `Description of product ${i}`,
                        price: i * 10,
                        category: categoryIds[i % 2],
                        quantity: i * 3,
                        shipping: i % 2 === 0,
                    },
                    files: {},
                },
                res
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Product created successfully',
                products: expect.objectContaining({
                    name: `Product ${i}`,
                    description: `Description of product ${i}`,
                    price: i * 10,
                    category: categoryIds[i % 2],
                    quantity: i * 3,
                    shipping: i % 2 === 0,
                }),
            });
        }

        // 4. Update "Category 2" -> "Updated Category"
        await updateCategoryController(
            {
                body: { name: 'Updated Category' },
                params: { id: categoryIds[1] },
            },
            res
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: 'Category Updated Successfully',
            category: expect.objectContaining({
                name: 'Updated Category',
            }),
        });

        // 5. Update "Category 1" -> "Updated Category" should fail
        await updateCategoryController(
            {
                body: { name: 'Updated Category' },
                params: { id: categoryIds[0] },
            },
            res
        );
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: 'Category already exists',
        });

        // 6. Ensure getProductController can get all products
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 10,
            message: 'All Products',
            products: expect.arrayContaining(
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) =>
                    expect.objectContaining({
                        name: `Product ${i}`,
                        description: `Description of product ${i}`,
                        price: i * 10,
                        // Category 1 or Updated Category
                        category: expect.objectContaining({
                            name:
                                i % 2 === 0 ? 'Category 1' : 'Updated Category',
                        }),
                        quantity: i * 3,
                        shipping: i % 2 === 0,
                    })
                )
            ),
        });
    });

    it('if products deleted before categories, should delete properly', async () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };

        // 1. Create 2 categories
        for (let i = 1; i <= 2; i++) {
            await createCategoryController(
                {
                    body: {
                        name: `Category ${i}`,
                    },
                },
                res
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'New category created',
                category: expect.objectContaining({ name: `Category ${i}` }),
            });
        }

        // 2. Ensure category list contains 2 categories
        await categoryController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: 'All Categories List',
            category: [1, 2].map((i) =>
                expect.objectContaining({ name: `Category ${i}` })
            ),
        });

        const categoryIds = res.send.mock.calls[
            res.send.mock.calls.length - 1
        ][0].category.map((x) => x._id);

        // 3. Create 10 products (5 from each category) from the categories
        for (let i = 1; i <= 10; i++) {
            await createProductController(
                {
                    fields: {
                        name: `Product ${i}`,
                        description: `Description of product ${i}`,
                        price: i * 10,
                        category: categoryIds[i % 2],
                        quantity: i * 3,
                        shipping: i % 2 === 0,
                    },
                    files: {},
                },
                res
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Product created successfully',
                products: expect.objectContaining({
                    name: `Product ${i}`,
                    description: `Description of product ${i}`,
                    price: i * 10,
                    category: categoryIds[i % 2],
                    quantity: i * 3,
                    shipping: i % 2 === 0,
                }),
            });
        }

        // 4. Ensure getProductController can get all products
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 10,
            message: 'All Products',
            products: expect.arrayContaining(
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) =>
                    expect.objectContaining({
                        name: `Product ${i}`,
                        description: `Description of product ${i}`,
                        price: i * 10,
                        category: expect.objectContaining({
                            name: `Category ${(i % 2) + 1}`,
                        }),
                        quantity: i * 3,
                        shipping: i % 2 === 0,
                    })
                )
            ),
        });

        // 5. Find all products with Category 2
        await productFiltersController(
            {
                body: {
                    checked: [categoryIds[1]],
                    radio: [],
                },
            },
            res
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            products: expect.arrayContaining(
                [1, 3, 5, 7, 9].map((i) =>
                    expect.objectContaining({
                        name: `Product ${i}`,
                        description: `Description of product ${i}`,
                        price: i * 10,
                        category: categoryIds[1],
                        quantity: i * 3,
                        shipping: i % 2 === 0,
                    })
                )
            ),
        });

        const toDeleteProducts = res.json.mock.calls[
            res.json.mock.calls.length - 1
        ][0].products.map((x) => x._id);

        // 5. Delete all products with Category 2
        for (const deleteId of toDeleteProducts) {
            await deleteProductController(
                {
                    params: { pid: deleteId },
                },
                res
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Product deleted successfully',
            });
        }

        // 6. Delete Category 2
        await deleteCategoryController(
            {
                params: { id: categoryIds[1] },
            },
            res
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: 'Category Deleted Successfully',
        });

        // 7. Ensure there are only 5 products left, all of Category 1
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 5,
            message: 'All Products',
            products: expect.arrayContaining(
                [2, 4, 6, 8, 10].map((i) =>
                    expect.objectContaining({
                        name: `Product ${i}`,
                        description: `Description of product ${i}`,
                        price: i * 10,
                        category: expect.objectContaining({
                            name: `Category 1`,
                        }),
                        quantity: i * 3,
                        shipping: i % 2 === 0,
                    })
                )
            ),
        });

        // 8. Ensure there is only 1 category left (Category 1)
        await categoryController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: 'All Categories List',
            category: [expect.objectContaining({ name: `Category 1` })],
        });
    });

    it('if categories with products deleted, return status 400', async () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };

        // 1. Create 2 categories
        for (let i = 1; i <= 2; i++) {
            await createCategoryController(
                {
                    body: {
                        name: `Category ${i}`,
                    },
                },
                res
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'New category created',
                category: expect.objectContaining({ name: `Category ${i}` }),
            });
        }

        // 2. Ensure category list contains 2 categories
        await categoryController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: 'All Categories List',
            category: [1, 2].map((i) =>
                expect.objectContaining({ name: `Category ${i}` })
            ),
        });

        const categoryIds = res.send.mock.calls[
            res.send.mock.calls.length - 1
        ][0].category.map((x) => x._id);

        // 3. Create 10 products (5 from each category) from the categories
        for (let i = 1; i <= 10; i++) {
            await createProductController(
                {
                    fields: {
                        name: `Product ${i}`,
                        description: `Description of product ${i}`,
                        price: i * 10,
                        category: categoryIds[i % 2],
                        quantity: i * 3,
                        shipping: i % 2 === 0,
                    },
                    files: {},
                },
                res
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Product created successfully',
                products: expect.objectContaining({
                    name: `Product ${i}`,
                    description: `Description of product ${i}`,
                    price: i * 10,
                    category: categoryIds[i % 2],
                    quantity: i * 3,
                    shipping: i % 2 === 0,
                }),
            });
        }

        // 4. Ensure getProductController can get all products
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 10,
            message: 'All Products',
            products: expect.arrayContaining(
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) =>
                    expect.objectContaining({
                        name: `Product ${i}`,
                        description: `Description of product ${i}`,
                        price: i * 10,
                        category: expect.objectContaining({
                            name: `Category ${(i % 2) + 1}`,
                        }),
                        quantity: i * 3,
                        shipping: i % 2 === 0,
                    })
                )
            ),
        });

        // 6. Delete Category 2
        await deleteCategoryController(
            {
                params: { id: categoryIds[1] },
            },
            res
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: 'Cannot delete category with existing products',
        });

        // 7. Ensure there are 10 products left
        await getProductController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            length: 10,
            message: 'All Products',
            products: expect.arrayContaining(
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) =>
                    expect.objectContaining({
                        name: `Product ${i}`,
                        description: `Description of product ${i}`,
                        price: i * 10,
                        category: expect.objectContaining({
                            name: `Category ${(i % 2) + 1}`,
                        }),
                        quantity: i * 3,
                        shipping: i % 2 === 0,
                    })
                )
            ),
        });

        // 8. Ensure there are 2 categories
        await categoryController(null, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: 'All Categories List',
            category: [
                expect.objectContaining({ name: 'Category 1' }),
                expect.objectContaining({ name: 'Category 2' }),
            ],
        });
    });
});
