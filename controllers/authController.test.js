import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
} from "./authController.js";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

// Mock dependencies
jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

describe("authController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {},
    };
    res = {
      send: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe("registerController", () => {
    const validUserData = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      phone: "1234567890",
      address: "123 Main St",
      answer: "security answer",
    };

    it("should register a new user successfully", async () => {
      req.body = validUserData;
      const hashedPassword = "$2b$10$hashedPassword";
      
      const saveMock = jest.fn().mockResolvedValue({
        _id: "userId123",
        ...validUserData,
        password: hashedPassword,
      });
      
      const mockUserInstance = {
        _id: "userId123",
        ...validUserData,
        password: hashedPassword,
        save: saveMock,
      };

      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue(hashedPassword);
      userModel.mockImplementation(() => mockUserInstance);

      await registerController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: validUserData.email });
      expect(hashPassword).toHaveBeenCalledWith(validUserData.password);
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "User Register Successfully",
        })
      );
    });

    it("should return error if name is not provided", async () => {
      req.body = { ...validUserData, name: "" };

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it("should return error if email is not provided", async () => {
      req.body = { ...validUserData, email: "" };

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it("should return error if password is not provided", async () => {
      req.body = { ...validUserData, password: "" };

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Password is Required" });
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it("should return error if phone is not provided", async () => {
      req.body = { ...validUserData, phone: "" };

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Phone no is Required" });
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it("should return error if address is not provided", async () => {
      req.body = { ...validUserData, address: "" };

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Address is Required" });
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it("should return error if answer is not provided", async () => {
      req.body = { ...validUserData, answer: "" };

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it("should return error if user already exists", async () => {
      req.body = validUserData;
      const existingUser = { email: validUserData.email };

      userModel.findOne.mockResolvedValue(existingUser);

      await registerController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: validUserData.email });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Already Register please login",
      });
      expect(hashPassword).not.toHaveBeenCalled();
    });

    it("should handle database errors during registration", async () => {
      req.body = validUserData;
      const mockError = new Error("Database error");
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      userModel.findOne.mockRejectedValue(mockError);

      await registerController(req, res);

      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Registeration"),
          error: mockError,
        })
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe("loginController", () => {
    const loginData = {
      email: "john@example.com",
      password: "password123",
    };

    const mockUser = {
      _id: "userId123",
      name: "John Doe",
      email: "john@example.com",
      password: "$2b$10$hashedPassword",
      phone: "1234567890",
      address: "123 Main St",
      role: 0,
    };

    it("should login user successfully with valid credentials", async () => {
      req.body = loginData;
      const mockToken = "jwt.token.here";

      userModel.findOne.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      JWT.sign.mockReturnValue(mockToken);

      await loginController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(comparePassword).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password
      );
      expect(JWT.sign).toHaveBeenCalledWith(
        { _id: mockUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "login successfully",
        user: {
          _id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          phone: mockUser.phone,
          address: mockUser.address,
          role: mockUser.role,
        },
        token: mockToken,
      });
    });

    it("should return error if email is not provided", async () => {
      req.body = { password: "password123" };

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it("should return error if password is not provided", async () => {
      req.body = { email: "john@example.com" };

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it("should return error if both email and password are not provided", async () => {
      req.body = {};

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it("should return error if user is not found", async () => {
      req.body = loginData;

      userModel.findOne.mockResolvedValue(null);

      await loginController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Email is not registered"),
        })
      );
      expect(comparePassword).not.toHaveBeenCalled();
    });

    it("should return error if password is incorrect", async () => {
      req.body = loginData;

      userModel.findOne.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);

      await loginController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(comparePassword).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Password",
      });
      expect(JWT.sign).not.toHaveBeenCalled();
    });

    it("should handle database errors during login", async () => {
      req.body = loginData;
      const mockError = new Error("Database error");
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      userModel.findOne.mockRejectedValue(mockError);

      await loginController(req, res);

      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in login",
        error: mockError,
      });

      consoleLogSpy.mockRestore();
    });
  });

  describe("forgotPasswordController", () => {
    const forgotPasswordData = {
      email: "john@example.com",
      answer: "security answer",
      newPassword: "newPassword123",
    };

    const mockUser = {
      _id: "userId123",
      email: "john@example.com",
      answer: "security answer",
    };

    it("should reset password successfully", async () => {
      req.body = forgotPasswordData;
      const hashedPassword = "$2b$10$newHashedPassword";

      userModel.findOne.mockResolvedValue(mockUser);
      hashPassword.mockResolvedValue(hashedPassword);
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      await forgotPasswordController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: forgotPasswordData.email,
        answer: forgotPasswordData.answer,
      });
      expect(hashPassword).toHaveBeenCalledWith(forgotPasswordData.newPassword);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(mockUser._id, {
        password: hashedPassword,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully",
      });
    });

    it("should return error if email is not provided", async () => {
      req.body = { answer: "answer", newPassword: "newPassword123" };
      
      userModel.findOne.mockResolvedValue(null);

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "Email is required" });
    });

    it("should return error if answer is not provided", async () => {
      req.body = { email: "john@example.com", newPassword: "newPassword123" };
      
      userModel.findOne.mockResolvedValue(null);

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "Answer is required" });
    });

    it("should return error if newPassword is not provided", async () => {
      req.body = { email: "john@example.com", answer: "answer" };
      
      userModel.findOne.mockResolvedValue(null);

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "New Password is required" });
    });

    it("should return error if user is not found with email and answer", async () => {
      req.body = forgotPasswordData;

      userModel.findOne.mockResolvedValue(null);

      await forgotPasswordController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: forgotPasswordData.email,
        answer: forgotPasswordData.answer,
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Wrong Email Or Answer",
      });
      expect(hashPassword).not.toHaveBeenCalled();
    });

    it("should handle database errors during password reset", async () => {
      req.body = forgotPasswordData;
      const mockError = new Error("Database error");
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      userModel.findOne.mockRejectedValue(mockError);

      await forgotPasswordController(req, res);

      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong",
        error: mockError,
      });

      consoleLogSpy.mockRestore();
    });
  });

  describe("testController", () => {
    it("should return 'Protected Routes' message successfully", () => {
      testController(req, res);

      expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });

    // it("should handle errors in testController", () => {
    //   const mockError = new Error("Test error");
    //   const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

    //   // Force an error by making res.send throw
    //   res.send = jest.fn(() => { throw mockError });

    //   testController(req, res);

    //   expect(consoleLogSpy).toHaveBeenCalledWith(mockError);

    //   consoleLogSpy.mockRestore();
    // });
  });
});

