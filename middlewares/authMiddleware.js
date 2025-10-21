import JWT from 'jsonwebtoken';
import userModel from '../models/userModel.js';

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
    try {
        const decode = JWT.verify(
            req.headers.authorization,
            process.env.JWT_SECRET
        );
        req.user = decode;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({
            success: false,
            message: 'Unauthorized - Invalid or expired token',
        });
    }
};

//admin access
export const isAdmin = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user._id);
        if (user.role === 0) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden - Admins only',
            });
        } else if (user.role !== 1) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access',
            });
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error,
            message: 'Error in admin middleware',
        });
    }
};
