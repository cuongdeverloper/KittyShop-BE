const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required']
    },
    description: {
        type: String,
        required: [true, 'Product description is required']
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
    },
    price: {
        type: String,
        required: [true, 'Product price is required']
    },
    sizes: [{
        size: {
            type: String,
            required: [true, 'Size is required']
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [0, 'Quantity cannot be less than 0']
        }
    }],
    colors: [{
        type: String
    }],
    previewImages: [{
        type: String
    }],
    productImages: [{
        type: String
    }],
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    salesPercent: {
        type: Number,
        min: 0,
        default: 0
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
