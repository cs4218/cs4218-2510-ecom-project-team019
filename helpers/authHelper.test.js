import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper";

// Mock bcrypt module
jest.mock("bcrypt");

describe("authHelper", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash password successfully", async () => {
      const password = "testPassword123";
      const mockHashedPassword = "$2b$10$mockHashedPasswordValue";

      bcrypt.hash.mockResolvedValue(mockHashedPassword);

      const result = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(mockHashedPassword);
    });

    it("should handle errors and log them", async () => {
      const password = "testPassword123";
      const mockError = new Error("Hashing failed");
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      bcrypt.hash.mockRejectedValue(mockError);

      const result = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
      expect(result).toBeUndefined();

      consoleLogSpy.mockRestore();
    });

    it("should use saltRounds of 10", async () => {
      const password = "anotherPassword";
      bcrypt.hash.mockResolvedValue("hashedValue");

      await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });
  });

  describe("comparePassword", () => {
    it("should return true when passwords match", async () => {
      const password = "testPassword123";
      const hashedPassword = "$2b$10$mockHashedPasswordValue";

      bcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it("should return false when passwords do not match", async () => {
      const password = "wrongPassword";
      const hashedPassword = "$2b$10$mockHashedPasswordValue";

      bcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });

    it("should handle errors from bcrypt.compare", async () => {
      const password = "testPassword";
      const hashedPassword = "$2b$10$mockHashedPasswordValue";
      const mockError = new Error("Compare failed");

      bcrypt.compare.mockRejectedValue(mockError);

      await expect(comparePassword(password, hashedPassword)).rejects.toThrow(
        "Compare failed"
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it("should handle empty password strings", async () => {
      const password = "";
      const hashedPassword = "$2b$10$mockHashedPasswordValue";

      bcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });
  });
});
