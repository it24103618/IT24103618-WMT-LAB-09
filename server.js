const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const studentRoutes = require('./routes/students');
const menuItemRoutes = require('./routes/menuItems');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-food';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        message: 'Campus Food Ordering API is running',
        version: '1.0.0',
        endpoints: {
            students: '/students',
            menuItems: '/menu-items',
            orders: '/orders',
            analytics: '/analytics'
        }
    });
});

app.use('/students', studentRoutes);
app.use('/menu-items', menuItemRoutes);
app.use('/orders', orderRoutes);
app.use('/analytics', analyticsRoutes);

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log(' Connected to MongoDB successfully');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 API URL: http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('a MongoDB connection error:', err.message);
        process.exit(1);
    });