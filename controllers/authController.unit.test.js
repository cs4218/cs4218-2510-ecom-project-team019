import {
    registerController,
    loginController,
    forgotPasswordController,
    testController,
    updateProfileController,
    getOrdersController,
    getAllOrdersController,
    orderStatusController,
} from './authController.js';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import * as authHelper from '../helpers/authHelper.js';
import JWT from 'jsonwebtoken';

// Mock dependencies
jest.mock('../models/userModel.js');
jest.mock('../helpers/authHelper.js');
jest.mock('../models/orderModel.js');
jest.mock('jsonwebtoken');

describe('unit test: authController', () => {
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

    describe('unit test: registerController', () => {
        const validUserData = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            phone: '1234567890',
            address: '123 Main St',
            answer: 'security answer',
        };

        it('should register a new user successfully', async () => {
            req.body = validUserData;
            const hashedPassword = '$2b$10$hashedPassword';

            const saveMock = jest.fn().mockResolvedValue({
                _id: 'userId123',
                ...validUserData,
                password: hashedPassword,
            });

            const mockUserInstance = {
                _id: 'userId123',
                ...validUserData,
                password: hashedPassword,
                save: saveMock,
            };

            userModel.findOne.mockResolvedValue(null);
            authHelper.hashPassword.mockResolvedValue(hashedPassword);
            userModel.mockImplementation(() => mockUserInstance);

            await registerController(req, res);

            expect(userModel.findOne).toHaveBeenCalledWith({
                email: validUserData.email,
            });
            expect(authHelper.hashPassword).toHaveBeenCalledWith(
                validUserData.password
            );
            expect(saveMock).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'User Register Successfully',
                })
            );
        });

        it('should return error if name is not provided', async () => {
            req.body = { ...validUserData, name: '' };

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Name is required',
            });
            expect(userModel.findOne).not.toHaveBeenCalled();
        });

        it('should return error if email is not provided', async () => {
            req.body = { ...validUserData, email: '' };

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email is required',
            });
            expect(userModel.findOne).not.toHaveBeenCalled();
        });

        it('should return error if password is not provided', async () => {
            req.body = { ...validUserData, password: '' };

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Password is required',
            });
            expect(userModel.findOne).not.toHaveBeenCalled();
        });

        it('should return error if phone is not provided', async () => {
            req.body = { ...validUserData, phone: '' };

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Phone no is required',
            });
            expect(userModel.findOne).not.toHaveBeenCalled();
        });

        it('should return error if address is not provided', async () => {
            req.body = { ...validUserData, address: '' };

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Address is required',
            });
            expect(userModel.findOne).not.toHaveBeenCalled();
        });

        it('should return error if answer is not provided', async () => {
            req.body = { ...validUserData, answer: '' };

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Answer is required',
            });
            expect(userModel.findOne).not.toHaveBeenCalled();
        });

        it('should return error if user already exists', async () => {
            req.body = validUserData;
            const existingUser = { email: validUserData.email };

            userModel.findOne.mockResolvedValue(existingUser);

            await registerController(req, res);

            expect(userModel.findOne).toHaveBeenCalledWith({
                email: validUserData.email,
            });
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Already registered, please login',
            });
            expect(authHelper.hashPassword).not.toHaveBeenCalled();
        });

        it('should handle database errors during registration', async () => {
            req.body = validUserData;
            const mockError = new Error('Database error');

            userModel.findOne.mockRejectedValue(mockError);

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Registration'),
                    error: mockError,
                })
            );
        });

        it('should handle errors during password hashing', async () => {
            req.body = validUserData;
            const mockError = new Error('Hashing error');

            userModel.findOne.mockResolvedValue(null);
            authHelper.hashPassword.mockRejectedValue(mockError);

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Registration'),
                })
            );
        });

        it('should handle errors during user save', async () => {
            req.body = validUserData;
            const hashedPassword = '$2b$10$hashedPassword';
            const mockError = new Error('Save error');

            const saveMock = jest.fn().mockRejectedValue(mockError);
            const mockUserInstance = { save: saveMock };

            userModel.findOne.mockResolvedValue(null);
            authHelper.hashPassword.mockResolvedValue(hashedPassword);
            userModel.mockImplementation(() => mockUserInstance);

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Registration'),
                })
            );
        });
    });

    describe('unit test: loginController', () => {
        const loginData = {
            email: 'john@example.com',
            password: 'password123',
        };

        const mockUser = {
            _id: 'userId123',
            name: 'John Doe',
            email: 'john@example.com',
            password: '$2b$10$hashedPassword',
            phone: '1234567890',
            address: '123 Main St',
            role: 0,
        };

        it('should login user successfully with valid credentials', async () => {
            req.body = loginData;
            const mockToken = 'jwt.token.here';

            userModel.findOne.mockResolvedValue(mockUser);
            authHelper.comparePassword.mockResolvedValue(true);
            JWT.sign.mockReturnValue(mockToken);

            await loginController(req, res);

            expect(userModel.findOne).toHaveBeenCalledWith({
                email: loginData.email,
            });
            expect(authHelper.comparePassword).toHaveBeenCalledWith(
                loginData.password,
                mockUser.password
            );
            expect(JWT.sign).toHaveBeenCalledWith(
                { _id: mockUser._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Login successfully',
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

        it('should return error if email is not provided', async () => {
            req.body = { password: 'password123' };

            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid email or password',
            });
            expect(userModel.findOne).not.toHaveBeenCalled();
        });

        it('should return error if password is not provided', async () => {
            req.body = { email: 'john@example.com' };

            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid email or password',
            });
            expect(userModel.findOne).not.toHaveBeenCalled();
        });

        it('should return error if both email and password are not provided', async () => {
            req.body = {};

            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid email or password',
            });
            expect(userModel.findOne).not.toHaveBeenCalled();
        });

        it('should return error if user is not found', async () => {
            req.body = loginData;

            userModel.findOne.mockResolvedValue(null);

            await loginController(req, res);

            expect(userModel.findOne).toHaveBeenCalledWith({
                email: loginData.email,
            });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Email is not registered'),
                })
            );
            expect(authHelper.comparePassword).not.toHaveBeenCalled();
        });

        it('should return error if password is incorrect', async () => {
            req.body = loginData;

            userModel.findOne.mockResolvedValue(mockUser);
            authHelper.comparePassword.mockResolvedValue(false);

            await loginController(req, res);

            expect(userModel.findOne).toHaveBeenCalledWith({
                email: loginData.email,
            });
            expect(authHelper.comparePassword).toHaveBeenCalledWith(
                loginData.password,
                mockUser.password
            );
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid password',
            });
            expect(JWT.sign).not.toHaveBeenCalled();
        });

        it('should handle database errors during login', async () => {
            req.body = loginData;
            const mockError = new Error('Database error');

            userModel.findOne.mockRejectedValue(mockError);

            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error in login',
                error: mockError,
            });
        });

        it('should handle errors during password comparison', async () => {
            req.body = loginData;
            const mockError = new Error('Compare error');

            userModel.findOne.mockResolvedValue(mockUser);
            authHelper.comparePassword.mockRejectedValue(mockError);

            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error in login',
                error: mockError,
            });
        });

        it('should handle errors during JWT token generation', async () => {
            req.body = loginData;
            const mockError = new Error('JWT error');

            userModel.findOne.mockResolvedValue(mockUser);
            authHelper.comparePassword.mockResolvedValue(true);
            JWT.sign.mockImplementation(() => {
                throw mockError;
            });

            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error in login',
                error: mockError,
            });
        });
    });

    describe('unit test: forgotPasswordController', () => {
        const forgotPasswordData = {
            email: 'john@example.com',
            answer: 'security answer',
            newPassword: 'newPassword123',
        };

        const mockUser = {
            _id: 'userId123',
            email: 'john@example.com',
            answer: 'security answer',
        };

        it('should reset password successfully', async () => {
            req.body = forgotPasswordData;
            const hashedPassword = '$2b$10$newHashedPassword';

            userModel.findOne.mockResolvedValue(mockUser);
            authHelper.hashPassword.mockResolvedValue(hashedPassword);
            userModel.findByIdAndUpdate.mockResolvedValue({
                ...mockUser,
                password: hashedPassword,
            });

            await forgotPasswordController(req, res);

            expect(userModel.findOne).toHaveBeenCalledWith({
                email: forgotPasswordData.email,
                answer: forgotPasswordData.answer,
            });
            expect(authHelper.hashPassword).toHaveBeenCalledWith(
                forgotPasswordData.newPassword
            );
            expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
                mockUser._id,
                {
                    password: hashedPassword,
                }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Password reset successfully',
            });
        });

        it('should return error if email is not provided', async () => {
            req.body = { answer: 'answer', newPassword: 'newPassword123' };

            userModel.findOne.mockResolvedValue(null);

            await forgotPasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Email is required',
            });
        });

        it('should return error if answer is not provided', async () => {
            req.body = {
                email: 'john@example.com',
                newPassword: 'newPassword123',
            };

            userModel.findOne.mockResolvedValue(null);

            await forgotPasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Answer is required',
            });
        });

        it('should return error if newPassword is not provided', async () => {
            req.body = { email: 'john@example.com', answer: 'answer' };

            userModel.findOne.mockResolvedValue(null);

            await forgotPasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'New Password is required',
            });
        });

        it('should return error if user is not found with email and answer', async () => {
            req.body = forgotPasswordData;

            userModel.findOne.mockResolvedValue(null);

            await forgotPasswordController(req, res);

            expect(userModel.findOne).toHaveBeenCalledWith({
                email: forgotPasswordData.email,
                answer: forgotPasswordData.answer,
            });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Wrong email or answer',
            });
            expect(authHelper.hashPassword).not.toHaveBeenCalled();
        });

        it('should handle database errors during password reset', async () => {
            req.body = forgotPasswordData;
            const mockError = new Error('Database error');

            userModel.findOne.mockRejectedValue(mockError);

            await forgotPasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Something went wrong',
                error: mockError,
            });
        });

        it('should handle errors during password hashing in forgot password', async () => {
            req.body = forgotPasswordData;
            const mockError = new Error('Hashing error');

            userModel.findOne.mockResolvedValue(mockUser);
            authHelper.hashPassword.mockRejectedValue(mockError);

            await forgotPasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Something went wrong',
                error: mockError,
            });
        });

        it('should handle errors during user update in forgot password', async () => {
            req.body = forgotPasswordData;
            const hashedPassword = '$2b$10$newHashedPassword';
            const mockError = new Error('Update error');

            userModel.findOne.mockResolvedValue(mockUser);
            authHelper.hashPassword.mockResolvedValue(hashedPassword);
            userModel.findByIdAndUpdate.mockRejectedValue(mockError);

            await forgotPasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Something went wrong',
                error: mockError,
            });
        });
    });

    describe('unit test: testController', () => {
        it("should return 'Protected routes' message successfully", () => {
            testController(req, res);

            expect(res.send).toHaveBeenCalledWith('Protected routes');
        });

        it('should handle errors in test controller', () => {
            const mockError = new Error('Test error');

            // Mock res.send to throw an error
            res.send = jest.fn(() => {
                throw mockError;
            });

            testController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: mockError });
        });
    });
});

describe('unit test: getOrdersController', () => {
    let req, res;
    beforeEach(() => {
        req = {
            user: {
                _id: 'user1ID',
            },
        };

        res = {
            json: jest.fn(),
            status: jest.fn(() => res),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 200 upon successful retrieval of orders', async () => {
        const mockOrders = [{ id: 1 }, { id: 2 }];

        // Mock the first populate to return an object with a second populate
        const secondPopulate = jest.fn().mockResolvedValueOnce(mockOrders);
        const firstPopulate = jest.fn(() => ({
            populate: secondPopulate,
        }));

        orderModel.find = jest.fn(() => ({
            populate: firstPopulate,
        }));

        await getOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalledWith({ buyer: req.user._id });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            orders: mockOrders
        });
    });

    it('should return 500 if error is thrown while retrieving orders', async () => {
        // Mock the first populate to return an object with a second populate
        const secondPopulate = jest.fn().mockRejectedValueOnce();
        const firstPopulate = jest.fn(() => ({
            populate: secondPopulate,
        }));

        orderModel.find = jest.fn(() => ({
            populate: firstPopulate,
        }));

        await getOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.any(String),
            })
        );
    });
});

describe('unit test: getAllOrdersController', () => {
    let req, res;
    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn(() => res),
            json: jest.fn(),
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 upon successful retrieval of all orders', async () => {
        const mockOrders = [{ id: 1 }, { id: 2 }];

        const sortMock = jest.fn().mockResolvedValueOnce(mockOrders);
        const secondPopulate = jest.fn(() => ({
            sort: sortMock,
        }));
        const firstPopulate = jest.fn(() => ({
            populate: secondPopulate,
        }));

        orderModel.find = jest.fn(() => ({
            populate: firstPopulate,
        }));

        await getAllOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    it('should return 500 if error is thrown while retrieving all orders', async () => {
        const sortMock = jest.fn().mockRejectedValueOnce();
        const secondPopulate = jest.fn(() => ({
            sort: sortMock,
        }));
        const firstPopulate = jest.fn(() => ({
            populate: secondPopulate,
        }));

        orderModel.find = jest.fn(() => ({
            populate: firstPopulate,
        }));

        await getAllOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.any(String),
            })
        );
    });
});

describe('unit test: orderStatusController', () => {
    let req, res;
    beforeEach(() => {
        req = {
            params: {
                orderId: 'orderId1',
            },
            body: {
                status: 'pending',
            },
        };

        res = {
            status: jest.fn(() => res),
            json: jest.fn(),
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 upon successful retrieval of order status', async () => {
        const mockOrders = [{ id: 1 }, { id: 2 }];

        orderModel.findByIdAndUpdate = jest.fn(() => mockOrders);

        await orderStatusController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    it('should return 500 if error is thrown while retrieving order status', async () => {
        orderModel.findByIdAndUpdate = jest.fn().mockRejectedValueOnce();

        await orderStatusController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.any(String),
            })
        );
    });
});

describe('unit test: updateProfileController', () => {
    let req, res;
    beforeEach(() => {
        req = {
            body: {
                name: 'user1',
                email: 'user1@gmail.com',
                password: 'user1password',
                address: 'CLB at NUS',
                phone: 91231234,
            },
            user: {
                _id: 'user1ID',
            },
        };

        res = {
            json: jest.fn(),
            status: jest.fn(() => res),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 200 upon successful updating profile', async () => {
        const hashedPassword = 'hashedPassword123';

        userModel.findById = jest.fn().mockResolvedValueOnce({
            name: req.body.user,
            password: req.body.password,
            phone: req.body.phone,
            address: req.body.address,
        });
        authHelper.hashPassword.mockResolvedValueOnce(hashedPassword);
        userModel.findByIdAndUpdate = jest.fn().mockResolvedValueOnce({});

        await updateProfileController(req, res);

        expect(userModel.findById).toHaveBeenCalledWith(req.user._id);
        expect(authHelper.hashPassword).toHaveBeenCalledWith(req.body.password);
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            req.user._id,
            expect.objectContaining({
                name: req.body.name,
                password: hashedPassword,
                phone: req.body.phone,
                address: req.body.address,
            }),
            { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });

    it('should return 400 if password does not meet requirements', async () => {
        req.body.password = '12345'; // invalid length
        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.any(String),
            })
        );
    });

    it('should return 500 if there is server error while updating user profile', async () => {
        userModel.findById = jest.fn().mockRejectedValueOnce();

        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.any(String),
            })
        );
    });
});
