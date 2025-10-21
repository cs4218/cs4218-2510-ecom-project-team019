import { jest } from '@jest/globals';

const categoryModel = require('../models/categoryModel.js');
const slugify = require('slugify');
const {
    createCategoryController,
    updateCategoryController,
    categoryController,
    singleCategoryController,
    deleteCategoryController,
} = require('./categoryController.js');
const productModel = require('../models/productModel.js');

// Mock the modules
jest.mock('../models/categoryModel.js', () => {
    const mockCategoryModel = jest.fn();
    mockCategoryModel.prototype.save = jest.fn();
    mockCategoryModel.findOne = jest.fn();
    mockCategoryModel.find = jest.fn();
    mockCategoryModel.findByIdAndUpdate = jest.fn();
    mockCategoryModel.findByIdAndDelete = jest.fn();
    mockCategoryModel.create = jest.fn();
    return mockCategoryModel;
});

jest.mock('../models/productModel.js', () => {
    const mockProductModel = jest.fn();
    mockProductModel.find = jest.fn();
    return mockProductModel;
});

jest.mock('slugify');

describe('Category Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
        };
        res = {
            status: jest.fn(() => res),
            send: jest.fn(),
        };
        slugify.mockImplementation((str) => str);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createCategoryController', () => {
        it('should return 400 if name is not provided', async () => {
            await createCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: 'Name is required',
            });
        });

        it('should return 409 if category already exists', async () => {
            req.body.name = 'Test Category';
            categoryModel.findOne.mockResolvedValue({ name: 'Test Category' });
            await createCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: 'Category already exists',
            });
        });

        it('should create a new category and return 201', async () => {
            req.body.name = 'Test Category';
            categoryModel.findOne.mockResolvedValue(null);
            const newCategory = {
                name: 'Test Category',
                slug: 'test-category',
            };
            const save = jest.fn().mockResolvedValue(newCategory);
            categoryModel.mockImplementation(() => ({
                save,
            }));

            await createCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'New category created',
                category: newCategory,
            });
        });

        it('should return 500 on error', async () => {
            req.body.name = 'Test Category';
            categoryModel.findOne.mockRejectedValue(new Error('Test Error'));
            await createCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: expect.any(Error),
                message: 'Error in Category',
            });
        });
    });

    describe('updateCategoryController', () => {
        it('should update a category and return 200', async () => {
            req.body.name = 'Updated Category';
            req.params.id = '1';

            const updatedCategory = {
                id: '1',
                name: 'Updated Category',
                slug: 'updated-category',
            };

            slugify.mockReturnValue('updated-category');

            categoryModel.findOne.mockResolvedValue(false);
            categoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);

            await updateCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'Category Updated Successfully',
                category: updatedCategory,
            });
        });

        it('should return 409 if category name already exists', async () => {
            req.body.name = 'Existing Category';
            req.params.id = '1';
            categoryModel.findOne.mockResolvedValue({
                name: 'Existing Category',
                _id: '2',
            });
            await updateCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: 'Category already exists',
            });
        });

        it('should return 500 on error', async () => {
            req.body.name = 'Updated Category';
            req.params.id = '1';
            categoryModel.findOne.mockResolvedValue(false);
            categoryModel.findByIdAndUpdate.mockRejectedValue(
                new Error('Test Error')
            );
            await updateCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: expect.any(Error),
                message: 'Error while updating category',
            });
        });
    });

    describe('categoryController', () => {
        it('should return all categories and status 200', async () => {
            const categories = [{ name: 'Category 1' }, { name: 'Category 2' }];
            categoryModel.find.mockResolvedValue(categories);
            await categoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'All Categories List',
                category: categories,
            });
        });

        it('should return 500 on error', async () => {
            categoryModel.find.mockRejectedValue(new Error('Test Error'));
            await categoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: expect.any(Error),
                message: 'Error while getting all categories',
            });
        });
    });

    describe('singleCategoryController', () => {
        it('should return a single category and status 200', async () => {
            req.params.slug = 'test-category';
            const category = { name: 'Test Category', slug: 'test-category' };
            categoryModel.findOne.mockResolvedValue(category);
            await singleCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'Get Single Category Successfully',
                category,
            });
        });

        it('should return 500 on error', async () => {
            req.params.slug = 'test-category';
            categoryModel.findOne.mockRejectedValue(new Error('Test Error'));
            await singleCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: expect.any(Error),
                message: 'Error while getting single category',
            });
        });
    });

    describe('deleteCategoryController', () => {
        it('should delete a category and return 200', async () => {
            req.params.id = '1';
            productModel.find.mockResolvedValue([]);
            categoryModel.findByIdAndDelete.mockResolvedValue({ _id: '1' }); // Return a truthy value
            await deleteCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'Category Deleted Successfully',
            });
        });

        it('should not delete a category with existing products and return 400', async () => {
            req.params.id = '1';
            productModel.find.mockResolvedValue([
                {
                    name: 'Test product',
                },
            ]);
            categoryModel.findByIdAndDelete.mockResolvedValue({});
            await deleteCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: 'Cannot delete category with existing products',
            });
        });

        it('should return 404 if category to delete does not exist', async () => {
            req.params.id = 'non-existent-id';
            productModel.find.mockResolvedValue([]);
            categoryModel.findByIdAndDelete.mockResolvedValue(null);
            await deleteCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: 'Category not found',
            });
        });

        it('should return 500 on error', async () => {
            req.params.id = '1';
            productModel.find.mockResolvedValue([]);
            categoryModel.findByIdAndDelete.mockRejectedValue(
                new Error('Test Error')
            );
            await deleteCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error while deleting category',
                error: expect.any(Error),
            });
        });
    });
});
