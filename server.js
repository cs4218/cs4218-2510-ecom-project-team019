import express from 'express';
import colors from 'colors';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import app from './app.js';

// configure env
dotenv.config();

//database config
connectDB();

const PORT = process.env.PORT || 6060;

app.listen(PORT, () => {
    console.log(
        `Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white
    );
});
