const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../model/products');
const uploadCloud = require('../config/cloudinaryConfig');

// Ensure uploads directory exists (if needed for local storage)
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for local image uploads (optional)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const now = new Date();
        const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        const filename = `img-${date}-${time}-${file.originalname}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images only!'));
    }
};

const uploadLocal = multer({
    storage: storage,
    fileFilter: fileFilter
}).fields([
    { name: 'previewImages', maxCount: 5 }, // Up to 5 preview images
    { name: 'productImages', maxCount: 15 } // Up to 10 product images
]);

const postCreateProductApi = async (req, res) => {
    uploadCloud.fields([
        { name: 'previewImages', maxCount: 5 },
        { name: 'productImages', maxCount: 15 }
    ])(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                errorCode: 4,
                message: err.message
            });
        }

        const { name, description, category, price, sizes, colors, salesPercent } = req.body;
        const previewImages = req.files.previewImages ? req.files.previewImages.map(file => file.path) : [];
        const productImages = req.files.productImages ? req.files.productImages.map(file => file.path) : [];

        if (!name || !description || !category || !price) {
            return res.status(400).json({
                errorCode: 5,
                message: 'Name, description, category, and price are required'
            });
        }

        try {
            const sizesArray = sizes ? JSON.parse(sizes) : [];

            const newProduct = new Product({
                name,
                description,
                category,
                price,
                sizes: sizesArray,
                colors: colors ? colors.split(',') : [],
                previewImages,
                productImages,
                salesPercent
            });

            await newProduct.save();
            return res.status(200).json({
                errorCode: 0,
                data: newProduct
            });
        } catch (saveError) {
            console.error('Error saving product:', saveError);
            return res.status(500).json({
                errorCode: 6,
                message: 'An error occurred while saving the product',
                details: saveError.message
            });
        }
    });
};


const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        return res.status(200).json({
            errorCode: 0,
            data: products
        });
    } catch (error) {
        console.error('Error retrieving products:', error);
        return res.status(500).json({
            errorCode: 3,
            message: 'An error occurred while retrieving products'
        });
    }
};

const getProductsByCategory = async (req, res) => {
    const { category } = req.query;
    if (!category) {
        return res.status(400).json({
            errorCode: 1,
            message: 'Category query parameter is required!'
        });
    }

    try {
        const products = await Product.find({ category: { $regex: new RegExp(category, 'i') } });
        return res.status(200).json({
            errorCode: 0,
            data: products
        });
    } catch (error) {
        console.error('Error retrieving products by category:', error);
        return res.status(500).json({
            errorCode: 3,
            message: 'An error occurred while retrieving products by category'
        });
    }
};
const getAllCategories = async (req, res) => {
    try {
        // Use aggregation to get distinct categories
        const categories = await Product.distinct('category');
        
        return res.status(200).json({
            errorCode: 0,
            data: categories
        });
    } catch (error) {
        console.error('Error retrieving categories:', error);
        return res.status(500).json({
            errorCode: 3,
            message: 'An error occurred while retrieving categories'
        });
    }
};


const updateProductSizeQuantity = async (req, res) => {
    const { productId } = req.params;
    const { size, quantity } = req.body;

    if (!size || quantity === undefined) {
        return res.status(400).json({
            errorCode: 1,
            message: 'Size and quantity are required'
        });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                errorCode: 2,
                message: 'Product not found'
            });
        }

        const sizeIndex = product.sizes.findIndex(s => s.size === size);
        if (sizeIndex === -1) {
            return res.status(404).json({
                errorCode: 3,
                message: 'Size not found'
            });
        }

        product.sizes[sizeIndex].quantity = quantity;

        await product.save();
        return res.status(200).json({
            errorCode: 0,
            message: 'Quantity updated successfully',
            data: product
        });
    } catch (error) {
        console.error('Error updating quantity:', error);
        return res.status(500).json({
            errorCode: 4,
            message: 'An error occurred while updating the quantity'
        });
    }
};


const getProductById = async (req, res) => {
    try {
        const { productId } = req.params; // Make sure this matches the route parameter
        const product = await Product.findById(productId); // Use productId here

        if (!product) {
            return res.status(404).send({ message: "Product not found" });
        }

        res.send(product);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error", error: error.message });
    }
};


const deleteProductById = async (req, res) => {
    const { productId } = req.params;

    if (!productId) {
        return res.status(400).json({
            errorCode: 1,
            message: 'Product ID is required'
        });
    }

    try {
        // Find and delete the product by its ID
        const result = await Product.findByIdAndDelete(productId);

        if (!result) {
            return res.status(404).json({
                errorCode: 2,
                message: 'Product not found'
            });
        }

        // Optionally, handle the deletion of associated files (e.g., images)
        // This would depend on your specific requirements and setup

        return res.status(200).json({
            errorCode: 0,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({
            errorCode: 3,
            message: 'An error occurred while deleting the product',
            details: error.message
        });
    }
};

const updateProductById = async (req, res) => {
    const { productId } = req.params;

    // Upload images to cloud or locally
    uploadCloud.fields([
        { name: 'previewImages', maxCount: 5 },
        { name: 'productImages', maxCount: 15 }
    ])(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                errorCode: 4,
                message: err.message
            });
        }

        const { name, description, category, price, sizes, colors, salesPercent } = req.body;
        const previewImages = req.files.previewImages ? req.files.previewImages.map(file => file.path) : [];
        const productImages = req.files.productImages ? req.files.productImages.map(file => file.path) : [];

        try {
            // Find the product by ID
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    errorCode: 1,
                    message: 'Product not found'
                });
            }

            // Update fields only if they are provided in the request
            if (name) product.name = name;
            if (description) product.description = description;
            if (category) product.category = category;
            if (price) product.price = price;
            if (sizes) product.sizes = JSON.parse(sizes);
            if (colors) product.colors = colors.split(',');
            if (salesPercent !== undefined) product.salesPercent = salesPercent;

            // Update images if provided
            if (previewImages.length > 0) product.previewImages = previewImages;
            if (productImages.length > 0) product.productImages = productImages;

            // Save the updated product
            const updatedProduct = await product.save();

            return res.status(200).json({
                errorCode: 0,
                data: updatedProduct,
                message: 'Product updated successfully'
            });
        } catch (error) {
            console.error('Error updating product:', error);
            return res.status(500).json({
                errorCode: 2,
                message: 'An error occurred while updating the product',
                details: error.message
            });
        }
    });
};


module.exports = { postCreateProductApi, getAllProducts,
     getProductsByCategory,updateProductSizeQuantity,getProductById
    ,getAllCategories,deleteProductById,updateProductById};
