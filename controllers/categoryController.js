import categoryModel from '../models/categoryModel.js';
import slugify from 'slugify';
import productModel from '../models/productModel.js';
export const createCategoryController = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).send({
                success: false,
                message: 'Name is required',
            });
        }
        const existingCategory = await categoryModel.findOne({ name });
        if (existingCategory) {
            return res.status(409).send({
                success: false,
                message: 'Category already exists',
            });
        }
        const category = await new categoryModel({
            name,
            slug: slugify(name),
        }).save();
        res.status(201).send({
            success: true,
            message: 'New category created',
            category,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: 'Error in Category',
        });
    }
};

//update category
export const updateCategoryController = async (req, res) => {
    try {
        const { name } = req.body;
        const { id } = req.params;
        const existingCategory = await categoryModel.findOne({ name });
        if (existingCategory) {
            return res.status(409).send({
                success: false,
                message: 'Category already exists',
            });
        }
        const category = await categoryModel.findByIdAndUpdate(
            id,
            { name, slug: slugify(name) },
            { new: true }
        );
        res.status(200).send({
            success: true,
            message: 'Category Updated Successfully',
            category,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: 'Error while updating category',
        });
    }
};

// get all cat
export const categoryController = async (req, res) => {
    try {
        const category = await categoryModel.find({});
        res.status(200).send({
            success: true,
            message: 'All Categories List',
            category,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: 'Error while getting all categories',
        });
    }
};

// single category
export const singleCategoryController = async (req, res) => {
    try {
        const category = await categoryModel.findOne({ slug: req.params.slug });
        res.status(200).send({
            success: true,
            message: 'Get Single Category Successfully',
            category,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: 'Error while getting single category',
        });
    }
};

//delete category
export const deleteCategoryController = async (req, res) => {
    try {
        const { id } = req.params;

        // ensure that categories with existing products are blocked
        // from being deleted
        const products = await productModel.find({ category: id });
        if (products.length > 0) {
            return res.status(400).send({
                success: false,
                message: 'Cannot delete category with existing products',
            });
        }

        await categoryModel.findByIdAndDelete(id);
        res.status(200).send({
            success: true,
            message: 'Category Deleted Successfully',
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error while deleting category',
            error,
        });
    }
};
