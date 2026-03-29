const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const router = express.Router();

router.get('/total-spent/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ error: 'Invalid student ID format' });
        }
        
        const result = await Order.aggregate([
            {
                $match: { student: new mongoose.Types.ObjectId(studentId) }
            },
            {
                $group: {
                    _id: '$student',
                    totalSpent: { $sum: '$totalPrice' }
                }
            }
        ]);
        
        const totalSpent = result.length > 0 ? result[0].totalSpent : 0;
        
        res.json({
            studentId,
            totalSpent
        });
    } catch (err) {
        console.error('Error calculating total spent:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/top-menu-items', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        
        const result = await Order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.menuItem',
                    totalQuantity: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: limit }
        ]);
        
        const populatedResults = [];
        for (const item of result) {
            const menuItem = await MenuItem.findById(item._id);
            if (menuItem) {
                populatedResults.push({
                    menuItem: {
                        id: menuItem._id,
                        name: menuItem.name,
                        price: menuItem.price,
                        category: menuItem.category
                    },
                    totalQuantity: item.totalQuantity
                });
            }
        }
        
        res.json(populatedResults);
    } catch (err) {
        console.error('Error getting top menu items:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/daily-orders', async (req, res) => {
    try {
        const result = await Order.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    orderCount: { $sum: 1 },
                    totalRevenue: { $sum: '$totalPrice' }
                }
            },
            {
                $sort: { 
                    '_id.year': 1, 
                    '_id.month': 1, 
                    '_id.day': 1 
                }
            }
        ]);
        
        const formattedResults = result.map(item => ({
            date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
            orderCount: item.orderCount,
            totalRevenue: item.totalRevenue
        }));
        
        res.json(formattedResults);
    } catch (err) {
        console.error('Error getting daily orders:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/order-summary', async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        
        const statusBreakdown = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const totalRevenue = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalPrice' }
                }
            }
        ]);
        
        res.json({
            totalOrders,
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            statusBreakdown: statusBreakdown.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        });
    } catch (err) {
        console.error('Error getting order summary:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;