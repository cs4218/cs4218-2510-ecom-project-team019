import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import {
  registerController,
  loginController,
  forgotPasswordController,
} from "./authController.js";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret-key";
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

const createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("loginController integration", () => {
  it("should return user payload and token when credentials are valid", async () => {
    const passwordHash = await hashPassword("password123");
    const seededUser = await userModel.create({
      name: "Jane Doe",
      email: "jane@example.com",
      password: passwordHash,
      phone: "1234567890",
      address: "123 Main Street",
      answer: "blue",
    });

    const req = {
      body: { 
        email: "jane@example.com", 
        password: "password123" 
      },
    };
    const res = createMockResponse();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toBe("Login successfully");
    expect(responseBody.user).toMatchObject({
      _id: seededUser._id,
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "1234567890",
      address: "123 Main Street",
    });
    expect(responseBody.token).toEqual(expect.any(String));

    const dbUser = await userModel.findOne({ email: "jane@example.com" });
    expect(dbUser).not.toBeNull();
    expect(dbUser._id.toString()).toBe(seededUser._id.toString());
  });

  it("should reject invalid password and keeps stored password hashed", async () => {
    const passwordHash = await hashPassword("password123");
    const seededUser = await userModel.create({
      name: "Jane Doe",
      email: "jane@example.com",
      password: passwordHash,
      phone: "1234567890",
      address: "123 Main Street",
      answer: "blue",
    });

    const req = {
      body: { 
        email: "jane@example.com", 
        password: "wrong-password" 
      },
    };
    const res = createMockResponse();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.success).toBe(false);
    expect(responseBody.message).toBe("Invalid password");
    expect(responseBody.token).toBeUndefined();

    const dbUser = await userModel.findOne({ email: "jane@example.com" });
    expect(dbUser.password).toBe(passwordHash);
    expect(dbUser._id.toString()).toBe(seededUser._id.toString());
  });

  it("should return not found when email is not registered", async () => {
    const req = {
      body: { 
        email: "nobody@example.com", 
        password: "password123" 
      },
    };
    const res = createMockResponse();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.success).toBe(false);
    expect(responseBody.message).toBe("Email is not registered");
  });

  it("should reject requests missing email or password", async () => {
    const cases = [
      { body: { email: "jane@example.com" } },
      { body: { password: "password123" } },
      { body: {} },
    ];

    for (const req of cases) {
      const res = createMockResponse();
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe("Invalid email or password");
    }
  });
});

describe("registerController integration", () => {
  it("should register a new user with hashed password", async () => {
    const req = {
      body: {
        name: "Alice Test",
        email: "alice@example.com",
        password: "SecurePass123",
        phone: "1112223333",
        address: "1 Test Lane",
        answer: "blue",
      },
    };
    const res = createMockResponse();

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toBe("User Register Successfully");
    expect(responseBody.user).toMatchObject({
      name: "Alice Test",
      email: "alice@example.com",
      phone: "1112223333",
      address: "1 Test Lane",
    });

    const storedUser = await userModel.findOne({ email: "alice@example.com" }).lean();
    expect(storedUser).not.toBeNull();
    expect(storedUser.answer).toBe("blue");
    expect(storedUser.password).not.toBe("SecurePass123");
    const passwordMatches = await comparePassword("SecurePass123", storedUser.password);
    expect(passwordMatches).toBe(true);
  });

  it("should reject missing required fields", async () => {
    const cases = [
      {
        body: {
          email: "missing-name@example.com",
          password: "Password123",
          phone: "1234567890",
          address: "123 Street",
          answer: "blue",
        },
        expectedMessage: "Name is required",
      },
      {
        body: {
          name: "Missing Email",
          password: "Password123",
          phone: "1234567890",
          address: "123 Street",
          answer: "blue",
        },
        expectedMessage: "Email is required",
      },
      {
        body: {
          name: "Missing Password",
          email: "missing-password@example.com",
          phone: "1234567890",
          address: "123 Street",
          answer: "blue",
        },
        expectedMessage: "Password is required",
      },
      {
        body: {
          name: "Missing Phone",
          email: "missing-phone@example.com",
          password: "Password123",
          address: "123 Street",
          answer: "blue",
        },
        expectedMessage: "Phone no is required",
      },
      {
        body: {
          name: "Missing Address",
          email: "missing-address@example.com",
          password: "Password123",
          phone: "1234567890",
          answer: "blue",
        },
        expectedMessage: "Address is required",
      },
      {
        body: {
          name: "Missing Answer",
          email: "missing-answer@example.com",
          password: "Password123",
          phone: "1234567890",
          address: "123 Street",
        },
        expectedMessage: "Answer is required",
      },
    ];

    for (const testCase of cases) {
      const res = createMockResponse();
      await registerController({ body: testCase.body }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe(testCase.expectedMessage);
    }
  });

  it("should reject duplicate email", async () => {
    const passwordHash = await hashPassword("Password123");
    await userModel.create({
      name: "Existing User",
      email: "duplicate@example.com",
      password: passwordHash,
      phone: "1234567890",
      address: "123 Street",
      answer: "blue",
    });

    const req = {
      body: {
        name: "New User",
        email: "duplicate@example.com",
        password: "Password123",
        phone: "9876543210",
        address: "456 Avenue",
        answer: "green",
      },
    };
    const res = createMockResponse();

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.success).toBe(false);
    expect(responseBody.message).toBe("Already registered, please login");
  });
});

describe("forgotPasswordController integration", () => {
  it("should reset password when security answer matches", async () => {
    const oldPasswordHash = await hashPassword("OldPassword123");
    const user = await userModel.create({
      name: "Reset User",
      email: "reset@example.com",
      password: oldPasswordHash,
      phone: "1234567890",
      address: "123 Street",
      answer: "blue",
    });

    const req = {
      body: {
        email: "reset@example.com",
        answer: "blue",
        newPassword: "NewPassword456",
      },
    };
    const res = createMockResponse();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toBe("Password reset successfully");

    const updatedUser = await userModel.findById(user._id);
    const matchesOld = await comparePassword("OldPassword123", updatedUser.password);
    expect(matchesOld).toBe(false);
    const matchesNew = await comparePassword("NewPassword456", updatedUser.password);
    expect(matchesNew).toBe(true);
  });

  it("should reject requests missing email, answer, or new password", async () => {
    const cases = [
      {
        body: { 
          answer: "blue", 
          newPassword: "NewPassword123" 
        },
        expectedMessage: "Email is required",
      },
      {
        body: { 
          email: "reset@example.com", 
          newPassword: "NewPassword123" 
        },
        expectedMessage: "Answer is required",
      },
      {
        body: { 
          email: "reset@example.com", 
          answer: "blue" 
        },
        expectedMessage: "New Password is required",
      },
    ];

    for (const testCase of cases) {
      const res = createMockResponse();
      await forgotPasswordController({ body: testCase.body }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.message).toBe(testCase.expectedMessage);
    }
  });

  it("should return not found when email or answer is incorrect", async () => {
    const passwordHash = await hashPassword("OldPassword123");
    await userModel.create({
      name: "Reset User",
      email: "reset2@example.com",
      password: passwordHash,
      phone: "1234567890",
      address: "123 Street",
      answer: "blue",
    });

    const req = {
      body: {
        email: "reset2@example.com",
        answer: "wrong",
        newPassword: "AnotherPassword789",
      },
    };
    const res = createMockResponse();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.success).toBe(false);
    expect(responseBody.message).toBe("Wrong email or answer");
  });
});
