import JWT from 'jsonwebtoken';
import { requireSignIn, isAdmin } from './authMiddleware';
import userModel from '../models/userModel.js';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../models/userModel.js');

describe('authMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            user: null,
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('requireSignIn', () => {
        it('should verify token and call next() on success', async () => {
            const mockToken = 'valid.jwt.token';
            const mockDecodedUser = {
                _id: 'user123',
                email: 'test@example.com',
            };

            req.headers.authorization = mockToken;
            JWT.verify.mockReturnValue(mockDecodedUser);

            await requireSignIn(req, res, next);

            expect(JWT.verify).toHaveBeenCalledWith(
                mockToken,
                process.env.JWT_SECRET
            );
            expect(req.user).toEqual(mockDecodedUser);
            expect(next).toHaveBeenCalled();
        });

        it('should handle invalid token and log error', async () => {
            const mockToken = 'invalid.jwt.token';
            const mockError = new Error('Invalid token');
            const consoleLogSpy = jest
                .spyOn(console, 'log')
                .mockImplementation();

            req.headers.authorization = mockToken;
            JWT.verify.mockImplementation(() => {
                throw mockError;
            });

            await requireSignIn(req, res, next);

            expect(JWT.verify).toHaveBeenCalledWith(
                mockToken,
                process.env.JWT_SECRET
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unauthorized - Invalid or expired token',
            });
            expect(next).not.toHaveBeenCalled();

            consoleLogSpy.mockRestore();
        });

        it('should handle expired token', async () => {
            const mockToken = 'expired.jwt.token';
            const mockError = new Error('Token expired');
            const consoleLogSpy = jest
                .spyOn(console, 'log')
                .mockImplementation();

            req.headers.authorization = mockToken;
            JWT.verify.mockImplementation(() => {
                throw mockError;
            });

            await requireSignIn(req, res, next);

            expect(JWT.verify).toHaveBeenCalledWith(
                mockToken,
                process.env.JWT_SECRET
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unauthorized - Invalid or expired token',
            });
            expect(req.user).toBeNull();

            consoleLogSpy.mockRestore();
        });

        it('should handle missing authorization header', async () => {
            const mockError = new Error('jwt must be provided');
            const consoleLogSpy = jest
                .spyOn(console, 'log')
                .mockImplementation();

            JWT.verify.mockImplementation(() => {
                throw mockError;
            });

            await requireSignIn(req, res, next);

            expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unauthorized - Invalid or expired token',
            });
            expect(next).not.toHaveBeenCalled();

            consoleLogSpy.mockRestore();
        });

        it('should set req.user with decoded token data', async () => {
            const mockToken = 'valid.jwt.token';
            const mockDecodedUser = {
                _id: 'user456',
                email: 'admin@example.com',
                role: 1,
            };

            req.headers.authorization = mockToken;
            JWT.verify.mockReturnValue(mockDecodedUser);

            await requireSignIn(req, res, next);

            expect(req.user).toEqual(mockDecodedUser);
            expect(req.user._id).toBe('user456');
            expect(req.user.email).toBe('admin@example.com');
        });
    });

    describe('isAdmin', () => {
        it('should call next() when user has admin role (role = 1)', async () => {
            const mockUser = {
                _id: 'admin123',
                email: 'admin@example.com',
                role: 1,
            };

            req.user = { _id: 'admin123' };
            userModel.findById.mockResolvedValue(mockUser);

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith('admin123');
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it('should return 403 when user is not admin (role = 0)', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'user@example.com',
                role: 0,
            };

            req.user = { _id: 'user123' };
            userModel.findById.mockResolvedValue(mockUser);

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith('user123');
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Forbidden - Admins only',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when user role is not 1', async () => {
            const mockUser = {
                _id: 'user456',
                email: 'user@example.com',
                role: 2,
            };

            req.user = { _id: 'user456' };
            userModel.findById.mockResolvedValue(mockUser);

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith('user456');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Unauthorized access',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle database errors and return 500', async () => {
            const mockError = new Error('Database connection failed');
            const consoleLogSpy = jest
                .spyOn(console, 'log')
                .mockImplementation();

            req.user = { _id: 'user123' };
            userModel.findById.mockRejectedValue(mockError);

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith('user123');
            expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: mockError,
                message: 'Error in admin middleware',
            });
            expect(next).not.toHaveBeenCalled();

            consoleLogSpy.mockRestore();
        });

        it('should handle user not found scenario', async () => {
            const mockError = new Error('User not found');
            const consoleLogSpy = jest
                .spyOn(console, 'log')
                .mockImplementation();

            req.user = { _id: 'nonexistent123' };
            userModel.findById.mockRejectedValue(mockError);

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith('nonexistent123');
            expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: mockError,
                message: 'Error in admin middleware',
            });

            consoleLogSpy.mockRestore();
        });

        it('should handle null user object', async () => {
            const mockError = new Error('Cannot read properties of null');
            const consoleLogSpy = jest
                .spyOn(console, 'log')
                .mockImplementation();

            req.user = { _id: 'user123' };
            userModel.findById.mockResolvedValue(null);

            // This will throw when trying to access null.role
            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith('user123');
            // Since user is null, accessing user.role will throw
            expect(consoleLogSpy).toHaveBeenCalled();

            consoleLogSpy.mockRestore();
        });

        it('should verify admin access for user with exactly role 1', async () => {
            const mockAdminUser = {
                _id: 'admin999',
                name: 'Super Admin',
                email: 'superadmin@example.com',
                role: 1,
            };

            req.user = { _id: 'admin999' };
            userModel.findById.mockResolvedValue(mockAdminUser);

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith('admin999');
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});
