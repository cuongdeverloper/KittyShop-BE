const express = require('express');
const passport = require('passport');
const { checkAccessToken, createJWT, createRefreshToken, verifyAccessToken, decodeToken } = require("../middleware/JWTAction");
const { apiLogin } = require("../controller/ApiAuth");
const { postCreateUserApi, getUserApi, deleteUserApi, updateUserApi, getUserWithPagination } = require("../controller/ApiUser");
const { postCreateProductApi, getAllProducts, getProductsByCategory, updateProductSizeQuantity, getProductById, getAllCategories, deleteProductById, updateProductById } = require('../controller/ApiProduct');
const { addToCart, getCart, deleteFromCart, getCartFromEachUser } = require('../controller/ApiCart');
const { postImageCategoryHomePage, getAllCategoryHomepages, getCategoryHomepageByCategory } = require('../controller/ApiCategoryHomepage');

const routerApi = express.Router();
const ApiNodejs = express.Router();

// Routes for user authentication and management
routerApi.post('/login', apiLogin);

routerApi.post('/user', postCreateUserApi);

// Apply middleware to routes that require authentication
routerApi.get('/user', getUserApi);
routerApi.put('/user', updateUserApi);
routerApi.delete('/user', deleteUserApi);
routerApi.get('/user-pagination',getUserWithPagination)
// Routes for product management
routerApi.post('/product', postCreateProductApi);
routerApi.get('/products', checkAccessToken, getAllProducts);
routerApi.delete('/product/:productId',deleteProductById)
routerApi.get('/product-category', getProductsByCategory);
routerApi.get('/product/categories',getAllCategories)
routerApi.put('/productById/:productId',updateProductById)
routerApi.put('/products/:productId', checkAccessToken, updateProductSizeQuantity);
routerApi.get('/product/:productId', getProductById);

// Google authentication routes
ApiNodejs.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

ApiNodejs.get('/google/redirect',
    passport.authenticate('google', { failureRedirect: 'http://localhost:6969/login' }),
    (req, res) => {
        // Successful authentication, redirect home.
        // res.redirect('http://localhost:6969/');
        const payload = { email: req.user.email, name: req.user.name, role: req.user.role, id:req.user.id };

        const accessToken = createJWT(payload);
        const refreshToken = createRefreshToken(payload);
        // res.json({
        //     accessToken: accessToken,
        //     refreshToken: refreshToken,
        //     user: req.user
        // });
        res.render('social.ejs', { accessToken: accessToken, refreshToken: refreshToken, user: req.user })
    });


routerApi.post('/decode-token', (req, res) => {
    const { token } = req.body;
    const data = decodeToken(token);
    if (data) {
        res.json({ data });
    } else {
        res.status(400).json({ error: 'Invalid token' });
    }
});


//Shopping cart
routerApi.post('/shoppingcart',checkAccessToken,addToCart)
routerApi.get('/shoppingcart',checkAccessToken,getCart)
routerApi.delete('/myshoppingcart',checkAccessToken,deleteFromCart)
routerApi.get('/myshoppingcart',checkAccessToken,getCartFromEachUser)

//Categoryomepage

routerApi.post('/categoryHomepage',postImageCategoryHomePage)
routerApi.get('/categoryHomepage',getAllCategoryHomepages)
routerApi.post('/categoryHomepage-search',getCategoryHomepageByCategory)


module.exports = { routerApi, ApiNodejs };
