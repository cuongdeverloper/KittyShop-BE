const Order = require("../model/order");
const Product = require("../model/products");


const createOrder = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user ID comes from authentication middleware
        const { address, phoneNumber, products,totalAmount } = req.body;
        // Validate input
        if (!address || !phoneNumber || !products) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate products and calculate total amount
        

        // Calculate the "dayToShip" (5 to 7 days after current date)
        const currentDate = new Date();
        const shippingDays = Math.floor(Math.random() * 3) + 5; // Random number between 5 and 7
        const dayToShip = new Date(currentDate);
        dayToShip.setDate(currentDate.getDate() + shippingDays);

        // Create the order
        const newOrder = new Order({
            user: userId,
            address,
            phoneNumber,
            products,
            totalAmount,
            dayToShip,
            status: 'Pending' // Default status when creating an order
        });

        await newOrder.save();

        res.status(201).json({ errorCode : 0,message: 'Order created successfully', order: newOrder });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'An error occurred while creating the order' });
    }
};
const getAllOrders = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Only admins can view all orders.' });
        }

        const orders = await Order.find().populate('user', 'username'); // Populating user field for better response
        res.status(200).json({ message: 'Orders retrieved successfully', orders });
    } catch (error) {
        console.error('Error retrieving orders:', error);
        res.status(500).json({ message: 'An error occurred while retrieving orders' });
    }
};

// Function to update an order (accessible by admins)
const updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params; // Get order ID from the request parameters
        const { status } = req.body; // Assuming we want to update the order status

        // Check if the user is an admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Only admins can update orders.' });
        }

        // Find the order by ID
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Update order status or any other fields you want
        order.status = status || order.status; // Update status if provided

        await order.save(); // Save the updated order

        res.status(200).json({ message: 'Order updated successfully', order });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'An error occurred while updating the order' });
    }
};

module.exports = { createOrder, getAllOrders, updateOrder };