const express = require('express');
const MenuItem = require('../models/MenuItem');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const menuItem = new MenuItem(req.body);
        const saved = await menuItem.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error('Error creating menu item:', err.message);
        res.status(400).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const menuItems = await MenuItem.find().sort({ createdAt: -1 });
        res.json(menuItems);
    } catch (err) {
        console.error('Error fetching menu items:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/search', async (req, res) => {
    try {
        const { name, category } = req.query;
        const filter = {};
        
        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }
        if (category) {
            filter.category = category;
        }
        
        const menuItems = await MenuItem.find(filter).sort({ name: 1 });
        res.json(menuItems);
    } catch (err) {
        console.error('Error searching menu items:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (err) {
        console.error('Error fetching menu item:', err.message);
        res.status(400).json({ error: 'Invalid ID' });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (err) {
        console.error('Error updating menu item:', err.message);
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json({ message: 'Menu item deleted successfully' });
    } catch (err) {
        console.error('Error deleting menu item:', err.message);
        res.status(400).json({ error: 'Invalid ID' });
    }
});

module.exports = router;