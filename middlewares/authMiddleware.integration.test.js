import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";

import { requireSignIn, isAdmin } from "./authMiddleware.js";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";

let mongoServer;

const createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret-key";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("requireSignIn integration", () => {
  it("should decode token and attach user payload to request", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const token = JWT.sign({ _id: userId }, process.env.JWT_SECRET);

    const req = { 
      headers: { authorization: token } 
    };
    const res = createMockResponse();
    const next = jest.fn();

    await requireSignIn(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ _id: userId });
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should respond 401 for invalid or expired tokens", async () => {
    const req = { 
      headers: { authorization: "invalid-token" } 
    };
    const res = createMockResponse();
    const next = jest.fn();

    await requireSignIn(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.success).toBe(false);
    expect(responseBody.message).toBe("Unauthorized - Invalid or expired token");
  });
});

describe("isAdmin integration", () => {
  const baseUser = {
    name: "Test User",
    email: "user@example.com",
    phone: "1234567890",
    address: "123 Test Street",
    answer: "blue",
  };

  it("should permit access when user role is admin", async () => {
    const hashed = await hashPassword("Password123");
    const admin = await userModel.create({
      ...baseUser,
      email: "admin@example.com",
      password: hashed,
      role: 1,
    });

    const req = { 
      user: { _id: admin._id } 
    };
    const res = createMockResponse();
    const next = jest.fn();

    await isAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should block non-admin users", async () => {
    const hashed = await hashPassword("Password123");
    const user = await userModel.create({
      ...baseUser,
      email: "nonadmin@example.com",
      password: hashed,
      role: 0,
    });

    const req = { 
      user: { _id: user._id } 
    };
    const res = createMockResponse();
    const next = jest.fn();

    await isAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.success).toBe(false);
    expect(responseBody.message).toBe("Unauthorized access");
  });

  it("should return 500 when user lookup fails", async () => {
    const req = { 
      user: { _id: new mongoose.Types.ObjectId() } 
    };
    const res = createMockResponse();
    const next = jest.fn();

    await isAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.success).toBe(false);
    expect(responseBody.message).toBe("Error in admin middleware");
  });
});

