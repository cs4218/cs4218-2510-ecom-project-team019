import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";

export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;
    // Validations
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });  
    if (!password) return res.status(400).json({ success: false, message: "Password is required" });
    if (!phone) return res.status(400).json({ success: false, message: "Phone no is required" });
    if (!address) return res.status(400).json({ success: false, message: "Address is required" });
    if (!answer) return res.status(400).json({ success: false, message: "Answer is required" });

    // Check user
    const existingUser = await userModel.findOne({ email });
    // Existing user
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Already registered, please login",
      });
    }
    // Register user
    const hashedPassword = await hashPassword(password);
    // Save user
    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
    }).save();

    res.status(201).json({
      success: true,
      message: "User Register Successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in Registration",
      error,
    });
  }
};

// POST LOGIN
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validation
    if (!email || !password) 
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    
    // Check user
    const user = await userModel.findOne({ email });
    if (!user) 
      return res.status(404).json({
        success: false,
        message: "Email is not registered",
      });
    
    const match = await comparePassword(password, user.password);
    if (!match) 
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    
    // Token
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({
      success: true,
      message: "Login successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

// ForgotPasswordController
export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!answer) return res.status(400).json({ message: "Answer is required" });
    if (!newPassword) return res.status(400).json({ message: "New Password is required" });
    
    // Check
    const user = await userModel.findOne({ email, answer });
    // Validation
    if (!user) 
      return res.status(404).json({
        success: false,
        message: "Wrong email or answer",
      });
    
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

// Test controller
export const testController = (req, res) => {
  try {
    res.send("Protected routes");
  } catch (error) {
    res.status(500).json({ error });
  }
};

//update prfole
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    if (password && password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const user = await userModel.findById(req.user._id);
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error WHile Update profile",
      error,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};
//orders
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error While Updateing Order",
      error,
    });
  }
};