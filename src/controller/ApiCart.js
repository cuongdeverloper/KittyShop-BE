const User = require('../model/user'); // Update this path as needed
const Product = require('../model/products');

const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const { productId, quantity, size } = req.body;

        // Validate input
        if (!productId || quantity === undefined || !size) {
            return res.status(400).json({ errorCode: 1, message: 'Product ID, quantity, and size are required' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ errorCode: 2, message: 'Product not found' });
        }

        // Find the selected size in the product's sizes array
        const sizeDetail = product.sizes.find(s => s.size === size);
        if (!sizeDetail) {
            return res.status(400).json({ errorCode: 3, message: 'Selected size not available for this product' });
        }

        // Check if the requested quantity exceeds the available stock
        if (quantity > sizeDetail.quantity) {
            return res.status(400).json({ errorCode: 4, message: 'Requested quantity exceeds available stock' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ errorCode: 6, message: 'User not found' });
        }

        // Ensure the cart is an array
        user.cart = user.cart || [];

        // Find the cart item by product ID and size
        const cartItemIndex = user.cart.findIndex(item => 
            item.product.toString() === productId && item.size === size
        );

        if (cartItemIndex > -1) {
            // Calculate the total quantity if adding more of the same item
            const newQuantity = user.cart[cartItemIndex].quantity + quantity;

            // Check if the new total quantity exceeds available stock
            if (newQuantity > sizeDetail.quantity) {
                return res.status(400).json({ errorCode: 5, message: 'Total quantity in cart exceeds available stock' });
            }

            // Update the quantity in the cart
            user.cart[cartItemIndex].quantity = newQuantity;
        } else {
            // Add new product with the specified size to the cart
            user.cart.push({ product: productId, quantity, size });
        }

        await user.save();

        return res.status(200).json({
            errorCode: 0,
            message: 'Product added to cart successfully',
            cart: user.cart
        });
    } catch (error) {
        console.error('Error adding product to cart:', error);
        return res.status(500).json({ errorCode: 7, message: 'An error occurred while adding the product to the cart' });
    }
};




const getCart = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you have middleware to extract user ID from JWT

        // Find the user by ID and populate the cart products
        const user = await User.findById(userId).populate('cart.product');

        if (!user) {
            return res.status(404).json({
                errorCode: 1,
                message: 'User not found'
            });
        }

        res.status(200).json({
            errorCode: 0,
            cart: user.cart
        });
    } catch (error) {
        console.error('Error retrieving cart:', error);
        res.status(500).json({
            errorCode: 2,
            message: 'An error occurred while retrieving the cart',
            details: error.message
        });
    }
};

const getCartFromEachUser = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you have middleware to extract user ID from JWT
        
        // Find the user by ID and populate the cart with product data
        const user = await User.findById(userId).populate('cart.product');

        if (!user) {
            return res.status(404).json({ errorCode: 1, message: 'User not found' });
        }

        // Extract product IDs from the user's cart
        const productIds = user.cart.map(item => item.product._id);

        // Fetch product details for each ID
        const products = await Product.find({ _id: { $in: productIds } });

        // Create a response object that includes product details and quantities
        const cartWithProductDetails = user.cart.map(cartItem => {
            const product = products.find(p => p._id.toString() === cartItem.product._id.toString());

            if (!product) {
                return null;
            }

            return {
                product: {
                    _id: product._id,
                    name: product.name,
                    description: product.description,
                    category: product.category,
                    price: product.price,
                    sizes: product.sizes,
                    colors: product.colors,
                    previewImages: product.previewImages,
                    productImages: product.productImages,
                    reviews: product.reviews,
                    salesPercent: product.salesPercent,
                },
                quantity: cartItem.quantity,
                size: cartItem.size
            };
        }).filter(item => item !== null); // Remove any null entries from the cart

        res.status(200).json({
            errorCode: 0,
            cart: cartWithProductDetails
        });
    } catch (error) {
        console.error('Error retrieving user cart:', error);
        res.status(500).json({
            errorCode: 2,
            message: 'An error occurred while retrieving the cart'
        });
    }
};


const deleteFromCart = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you have user authentication and the user ID is stored in `req.user`
        const { productId, size } = req.body;

        if (!productId || !size) {
            return res.status(400).json({ errorCode: 1, message: 'Product ID and size are required' });
        }

        const user = await User.findById(userId);

        const cartItemIndex = user.cart.findIndex(item => 
            item.product.toString() === productId && item.size === size
        );

        if (cartItemIndex > -1) {
            // Remove the item from the cart
            user.cart.splice(cartItemIndex, 1);
            await user.save();

            return res.status(200).json({
                errorCode: 0,
                message: 'Product removed from cart successfully',
                cart: user.cart
            });
        } else {
            return res.status(404).json({ errorCode: 2, message: 'Product not found in cart' });
        }

    } catch (error) {
        console.error('Error deleting product from cart:', error);
        return res.status(500).json({ errorCode: 3, message: 'An error occurred while deleting the product from the cart' });
    }
};

module.exports = { addToCart, getCart, deleteFromCart,getCartFromEachUser };
