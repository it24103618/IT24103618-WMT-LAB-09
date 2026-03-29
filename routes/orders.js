const express = require('express');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Student = require('../models/Student');
const router = express.Router();

async function calculateTotalPrice(items) {
    const menuItemIds = items.map(item => item.menuItem);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
    
    const priceMap = {};
    menuItems.forEach(item => {
        priceMap[item._id.toString()] = item.price;
    });
    
    let total = 0;
    for (const item of items) {
        const itemId = item.menuItem.toString();
        if (!priceMap[itemId]) {
            throw new Error(`Invalid menu item ID: ${itemId}`);
        }
        total += priceMap[itemId] * item.quantity;
    }
    return total;
}

router.post('/', async (req, res) => {
    try {
        const { student, items } = req.body;
        
        const studentExists = await Student.findById(student);
        if (!studentExists) {
            return res.status(400).json({ error: 'Student not found' });
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items must be a non-empty array' });
        }
        
        const totalPrice = await calculateTotalPrice(items);
        
        const order = new Order({
            student,
            items,
            totalPrice,
            status: 'PLACED'
        });
        
        const savedOrder = await order.save();
        
        const populatedOrder = await Order.findById(savedOrder._id)
            .populate('student')
            .populate('items.menuItem');
        
        res.status(201).json(populatedOrder);
    } catch (err) {
        console.error('Error creating order:', err.message);
        res.status(400).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('student')
            .populate('items.menuItem')
            .skip(skip)
            .limit(limit);
        
        const totalOrders = await Order.countDocuments();
        
        res.json({
            orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
                totalItems: totalOrders,
                itemsPerPage: limit,
                hasNextPage: page * limit < totalOrders,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        console.error('Error fetching orders:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('student')
            .populate('items.menuItem');
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(order);
    } catch (err) {
        console.error('Error fetching order:', err.message);
        res.status(400).json({ error: 'Invalid order ID' });
    }
});

router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['PLACED', 'PREPARING', 'DELIVERED', 'CANCELLED'];
        
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({ 
                error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` 
            });
        }
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        )
            .populate('student')
            .populate('items.menuItem');
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(order);
    } catch (err) {
        console.error('Error updating order status:', err.message);
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json({ message: 'Order deleted successfully', orderId: req.params.id });
    } catch (err) {
        console.error('Error deleting order:', err.message);
        res.status(400).json({ error: 'Invalid order ID' });
    }
});

module.exports = router;