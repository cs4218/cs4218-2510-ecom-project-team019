import { jest } from '@jest/globals';

// 🟢 Set up mocks BEFORE imports
jest.unstable_mockModule('../models/categoryModel.js', () => {
  const mockCategoryModel = jest.fn(); // behaves like a constructor
  mockCategoryModel.prototype.save = jest.fn(); // instance method

  // add static methods
  mockCategoryModel.findOne = jest.fn();
  mockCategoryModel.find = jest.fn();
  mockCategoryModel.findByIdAndUpdate = jest.fn();
  mockCategoryModel.findByIdAndDelete = jest.fn();
  mockCategoryModel.create = jest.fn();

  return { default: mockCategoryModel };
});


jest.unstable_mockModule('slugify', () => ({
  default: jest.fn((str) => `mocked-${str}`),
}));

// 🟢 Import AFTER mocks are declared
const categoryModel = (await import('../models/categoryModel.js')).default;
const slugify = (await import('slugify')).default;
const {
  createCategoryController,
  updateCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryController,
} = await import('./categoryController.js');

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
                message: 'Name is required' 
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

        it('should create a new category and return 200', async () => {
            req.body.name = 'Test Category';
            categoryModel.findOne.mockResolvedValue(null);
            const newCategory = { name: 'Test Category', slug: 'test-category' };
            const save = jest.fn().mockResolvedValue(newCategory);
            categoryModel.mockImplementation(() => ({
                save,
            }));

            await createCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
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

            const updatedCategory = {id: '1', name: 'Updated Category', slug: 'updated-category' };

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
            categoryModel.findOne.mockResolvedValue({ name: 'Existing Category', _id: '2' });
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
            categoryModel.findByIdAndUpdate.mockRejectedValue(new Error('Test Error'));
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
            categoryModel.findByIdAndDelete.mockResolvedValue({});
            await deleteCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'Category Deleted Successfully',
            });
        });

        it('should return 500 on error', async () => {
            req.params.id = '1';
            categoryModel.findByIdAndDelete.mockRejectedValue(new Error('Test Error'));
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
