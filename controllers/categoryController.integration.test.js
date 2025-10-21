
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import http from 'http';
import categoryRoutes from '../routes/categoryRoutes.js';
import Category from '../models/categoryModel.js';

jest.mock('../middlewares/authMiddleware.js', () => ({
  requireSignIn: (req, res, next) => next(),
  isAdmin: (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/v1/category', categoryRoutes);

jest.setTimeout(30000);

let mongoServer;
let server;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve)); // Listen on a random free port
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  await new Promise(resolve => server.close(resolve));
});

beforeEach(async () => {
    await Category.deleteMany({});
});

describe('Category API', () => {
  it('should create a new category', async () => {
    const port = server.address().port;
    const postData = JSON.stringify({ name: 'Test Category' });

    const options = {
      hostname: 'localhost',
      port: port,
      path: '/api/v1/category/create-category',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            expect(res.statusCode).toBe(201);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', async () => {
                const responseBody = JSON.parse(data);
                expect(responseBody.success).toBe(true);
                expect(responseBody.category.name).toBe('Test Category');

                const category = await Category.findOne({ name: 'Test Category' });
                expect(category).not.toBeNull();
                resolve();
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
  });

  it('should update an existing category', async () => {
    const category = new Category({ name: 'Original Category', slug: 'original-category' });
    await category.save();

    const port = server.address().port;
    const putData = JSON.stringify({ name: 'Updated Category' });

    const options = {
      hostname: 'localhost',
      port: port,
      path: `/api/v1/category/update-category/${category._id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(putData),
      },
    };

    await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            expect(res.statusCode).toBe(200);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', async () => {
                const responseBody = JSON.parse(data);
                expect(responseBody.success).toBe(true);
                expect(responseBody.category.name).toBe('Updated Category');

                const updatedCategory = await Category.findById(category._id);
                expect(updatedCategory.name).toBe('Updated Category');
                resolve();
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(putData);
        req.end();
    });
  });

  it('should delete an existing category', async () => {
    const category = new Category({ name: 'To Be Deleted', slug: 'to-be-deleted' });
    await category.save();

    const port = server.address().port;

    const options = {
      hostname: 'localhost',
      port: port,
      path: `/api/v1/category/delete-category/${category._id}`,
      method: 'DELETE',
    };

    await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            expect(res.statusCode).toBe(200);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', async () => {
                const responseBody = JSON.parse(data);
                expect(responseBody.success).toBe(true);

                const deletedCategory = await Category.findById(category._id);
                expect(deletedCategory).toBeNull();
                resolve();
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
  });

  it('should get all categories', async () => {
    await Category.insertMany([
      { name: 'Category 1', slug: 'category-1' },
      { name: 'Category 2', slug: 'category-2' },
    ]);

    const port = server.address().port;

    const options = {
      hostname: 'localhost',
      port: port,
      path: '/api/v1/category/get-category',
      method: 'GET',
    };

    await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            expect(res.statusCode).toBe(200);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', async () => {
                const responseBody = JSON.parse(data);
                expect(responseBody.success).toBe(true);
                expect(Array.isArray(responseBody.category)).toBe(true);
                expect(responseBody.category.length).toBe(2);
                resolve();
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
  });

  it('should get a single category', async () => {
    const category = new Category({ name: 'Single Category', slug: 'single-category' });
    await category.save();

    const port = server.address().port;

    const options = {
      hostname: 'localhost',
      port: port,
      path: `/api/v1/category/single-category/${category.slug}`,
      method: 'GET',
    };

    await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            expect(res.statusCode).toBe(200);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', async () => {
                const responseBody = JSON.parse(data);
                expect(responseBody.success).toBe(true);
                expect(responseBody.category.name).toBe('Single Category');
                resolve();
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
  });

  it('should not create a category with a duplicate name', async () => {
    await Category.create({ name: 'Duplicate Category', slug: 'duplicate-category' });

    const port = server.address().port;
    const postData = JSON.stringify({ name: 'Duplicate Category' });

    const options = {
      hostname: 'localhost',
      port: port,
      path: '/api/v1/category/create-category',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            expect(res.statusCode).toBe(409);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', async () => {
                const responseBody = JSON.parse(data);
                expect(responseBody.success).toBe(false);
                expect(responseBody.message).toBe('Category already exists');
                resolve();
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
  });

  it('should not create a category with an empty name', async () => {
    const port = server.address().port;
    const postData = JSON.stringify({ name: '' });

    const options = {
      hostname: 'localhost',
      port: port,
      path: '/api/v1/category/create-category',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            expect(res.statusCode).toBe(400);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', async () => {
                const responseBody = JSON.parse(data);
                expect(responseBody.success).toBe(false);
                expect(responseBody.message).toBe('Name is required');
                resolve();
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
  });

  it('should not delete a category that does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const port = server.address().port;

    const options = {
      hostname: 'localhost',
      port: port,
      path: `/api/v1/category/delete-category/${nonExistentId}`,
      method: 'DELETE',
    };

    await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            expect(res.statusCode).toBe(404);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const responseBody = JSON.parse(data);
                expect(responseBody.success).toBe(false);
                expect(responseBody.message).toBe('Category not found');
                resolve();
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
  });
  
});
