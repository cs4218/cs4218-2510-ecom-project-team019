import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server'; // (an in-memory MongoDB) so that can test schema without touching a real DB
import Product from '../models/productModel.js';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

beforeEach(async () => {
    const collections = Object.values(mongoose.connection.collections);
    for (const coll of collections) {
        await coll.deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

const requiredFields = [
    'name',
    'slug',
    'description',
    'price',
    'category',
    'quantity',
];

describe('Product Model', () => {
    it.each(requiredFields)(
        'should not allow if fields are missing',
        async (field) => {
            const validData = {
                name: 'Product 1',
                slug: 'product-1',
                description: 'Description of Product 1',
                price: 100,
                category: new mongoose.Types.ObjectId(),
                quantity: 5,
            };

            delete validData[field];

            const product = new Product(validData);
            await expect(product.validate()).rejects.toThrow(field);
        }
    );

    it('should validate successfully when all required fields are present', async () => {
        const product = new Product({
            name: 'T-shirt',
            slug: 't-shirt',
            description: 'A nice shirt',
            price: 19.99,
            category: new mongoose.Types.ObjectId(),
            quantity: 10,
        });
        await expect(product.validate()).resolves.toBeUndefined();
    });

    it('should fail validation when price is not a number', async () => {
        const product = new Product({
            name: 'A',
            slug: 'a',
            description: 'a',
            price: 'abc',
            category: new mongoose.Types.ObjectId(),
            quantity: 5,
        });
        await expect(product.validate()).rejects.toThrow(
            /Cast to Number failed/
        );
    });

    it('should fail when category is not an ObjectId', async () => {
        const product = new Product({
            name: 'A',
            slug: 'a',
            description: 'a',
            price: 10,
            category: 'not-an-id',
            quantity: 5,
        });
        await expect(product.validate()).rejects.toThrow(
            /Cast to ObjectId failed/
        );
    });

    it('should fail when name already exists', async () => {
        const product = new Product({
            name: 'A',
            slug: 'a',
            description: 'a',
            price: 10,
            category: new mongoose.Types.ObjectId(),
            quantity: 5,
        });
        await expect(product.validate()).resolves.toBeUndefined();
        await product.save();

        await expect(
            Product.create({
                name: 'A',
                slug: 'b',
                description: 'a',
                price: 10,
                category: new mongoose.Types.ObjectId(),
                quantity: 5,
            })
        ).rejects.toThrow(/E11000 duplicate key error/);
    });

    it('should fail when slug already exists', async () => {
        const product = new Product({
            name: 'A',
            slug: 'a',
            description: 'a',
            price: 10,
            category: new mongoose.Types.ObjectId(),
            quantity: 5,
        });
        await expect(product.validate()).resolves.toBeUndefined();
        await product.save();

        await expect(
            Product.create({
                name: 'B',
                slug: 'a',
                description: 'a',
                price: 10,
                category: new mongoose.Types.ObjectId(),
                quantity: 5,
            })
        ).rejects.toThrow(/E11000 duplicate key error/);
    });

    it('should save without photo and shipping', async () => {
        const product = await Product.create({
            name: 'Shoes',
            slug: 'shoes',
            description: 'A pair of shoes',
            price: 49.99,
            category: new mongoose.Types.ObjectId(),
            quantity: 20,
        });
        expect(product.photo).toEqual({});
        expect(product.shipping).toBeUndefined();
    });
});
