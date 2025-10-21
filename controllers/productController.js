import productModel from '../models/productModel.js';
import categoryModel from '../models/categoryModel.js';
import orderModel from '../models/orderModel.js';

import fs from 'fs';
import slugify from 'slugify';
import braintree from 'braintree';
import dotenv from 'dotenv';

dotenv.config();

//payment gateway
export const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export const createProductController = async (req, res) => {
    try {
        const { name, description, price, category, quantity, shipping } =
            req.fields;
        const { photo } = req.files;
        // Validation
        switch (true) {
            case !name:
                return res.status(400).json({ error: 'Name is required' });
            case !description:
                return res
                    .status(400)
                    .json({ error: 'Description is required' });
            case !price:
                return res.status(400).json({ error: 'Price is required' });
            case !category:
                return res.status(400).json({ error: 'Category is required' });
            case !quantity:
                return res.status(400).json({ error: 'Quantity is required' });
            case shipping === undefined:
                return res.status(400).json({ error: 'Shipping is required' });
            case photo && photo.size > 1000000:
                return res.status(400).json({
                    error: 'Photo provided should be less than 1MB',
                });
        }

        const products = new productModel({
            ...req.fields,
            slug: slugify(name),
        });
        if (photo) {
            products.photo.data = fs.readFileSync(photo.path);
            products.photo.contentType = photo.type;
        }
        await products.save();
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while creating product',
        });
    }
};

//get all products
export const getProductController = async (req, res) => {
    try {
        const products = await productModel
            .find({})
            .populate('category')
            .select('-photo')
            .limit(12)
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            length: products.length,
            message: 'All Products',
            products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error in getting products',
            error: error.message,
        });
    }
};
// get single product
export const getSingleProductController = async (req, res) => {
    try {
        const product = await productModel
            .findOne({ slug: req.params.slug })
            .select('-photo')
            .populate('category');

        // If no product found, return 404
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Single product fetched',
            product,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error while getting single product',
            error: error.message,
        });
    }
};

// get photo
export const productPhotoController = async (req, res) => {
    try {
        const product = await productModel
            .findById(req.params.pid)
            .select('photo');

        if (product && product.photo.data) {
            res.set('Content-Type', product.photo.contentType);
            return res.status(200).send(product.photo.data);
        } else {
            return res.status(404).send('Photo not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Delete controller
export const deleteProductController = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.params.pid).select('-photo');
        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error while deleting product',
            error: error.message,
        });
    }
};

// Update products
export const updateProductController = async (req, res) => {
    try {
        const { name, description, price, category, quantity, shipping } =
            req.fields;
        const { photo } = req.files;

        // Validation
        switch (true) {
            case !name:
                return res.status(400).json({ error: 'Name is required' });
            case !description:
                return res
                    .status(400)
                    .json({ error: 'Description is required' });
            case !price:
                return res.status(400).json({ error: 'Price is required' });
            case !category:
                return res.status(400).json({ error: 'Category is required' });
            case !quantity:
                return res.status(400).json({ error: 'Quantity is required' });
            case shipping === undefined:
                return res.status(400).json({ error: 'Shipping is required' });
            case photo && photo.size > 1000000:
                return res.status(400).json({
                    error: 'Photo provided should be less than 1MB',
                });
        }

        const products = await productModel.findByIdAndUpdate(
            req.params.pid,
            { ...req.fields, slug: slugify(name) },
            { new: true }
        );
        if (photo) {
            products.photo = products.photo ?? {};
            products.photo.data = fs.readFileSync(photo.path);
            products.photo.contentType = photo.type;
        }
        await products.save();
        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while updating product',
        });
    }
};

// Product filters
export const productFiltersController = async (req, res) => {
    try {
        const { checked, radio } = req.body;
        let args = {};
        if (checked.length > 0) args.category = checked;
        if (radio.length === 2) args.price = { $gte: radio[0], $lte: radio[1] };
        const products = await productModel.find(args);
        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error while filtering products',
            error: error.message,
        });
    }
};

// Product count
export const productCountController = async (req, res) => {
    try {
        const total = await productModel.find({}).estimatedDocumentCount();
        res.status(200).json({
            success: true,
            total,
            message: 'Product count fetched',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error in getting product count',
            error: error.message,
            success: false,
        });
    }
};

// Product list based on page
export const productListController = async (req, res) => {
    try {
        const perPage = 6;
        const page = req.params.page ? req.params.page : 1;
        const products = await productModel
            .find({})
            .select('-photo')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error in getting products by page',
            error: error.message,
        });
    }
};

// search product
export const searchProductController = async (req, res) => {
    try {
        const { keyword } = req.params;
        const results = await productModel
            .find({
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                ],
            })
            .select('-photo');
        res.status(200).json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error in Search Product API',
            error: error.message,
        });
    }
};

// similar products
export const relatedProductController = async (req, res) => {
    try {
        const { pid, cid } = req.params;
        const products = await productModel
            .find({
                category: cid,
                _id: { $ne: pid },
            })
            .select('-photo')
            .limit(3)
            .populate('category');
        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error while getting related product',
            error: error.message,
        });
    }
};

// get products by catgory
export const productCategoryController = async (req, res) => {
    try {
        const category = await categoryModel.findOne({ slug: req.params.slug });
        const products = await productModel
            .find({ category })
            .populate('category');
        res.status(200).json({
            success: true,
            category,
            products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while getting products by category',
        });
    }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
    try {
        gateway.clientToken.generate({}, function (err, response) {
            if (err) {
                res.status(500).json({ ok: false, error: err });
            } else {
                res.json({ ok: true });
            }
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error });
    }
};

//payment
export const brainTreePaymentController = async (req, res) => {
    try {
        const { nonce, cart } = req.body;

        if (!nonce || !cart) {
            return res
                .status(400)
                .json({ ok: false, message: 'Missing nonce or cart' });
        }

        const products = cart.map((product) => product._id);

        let total = 0;
        cart.forEach((i) => {
            total += i.price;
        });

        // Wrap the callback-based function in a Promise
        const result = await new Promise((resolve, reject) => {
            gateway.transaction.sale(
                {
                    amount: total.toFixed(2),
                    paymentMethodNonce: nonce,
                    options: { submitForSettlement: true },
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
        });

        if (result && result.success) {
            await orderModel.create({
                products: products,
                payment: result,
                buyer: req.user._id,
            });

            res.status(200).json({ ok: true, transaction: result });
        } else {
            res.status(500).json({ ok: false, error: result });
        }
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};
