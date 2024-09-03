const uploadCloud = require("../config/cloudinaryConfig");
const categoryHomepage = require("../model/categoryHomepage");

const postImageCategoryHomePage = async (req, res) => {
    uploadCloud.fields([
        { name: 'mainImage', maxCount: 5 }
    ])(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                errorCode: 4,
                message: err.message
            });
        }

        const { category, description } = req.body;
        const mainImage = req.files.mainImage ? req.files.mainImage.map(file => file.path) : [];

        if (!category || !description) {
            return res.status(400).json({
                errorCode: 5,
                message: 'Category and description are required'
            });
        }

        try {
            const newCategoryHomepage = new categoryHomepage({
                category,
                description,
                mainImage
            });

            await newCategoryHomepage.save();
            return res.status(200).json({
                errorCode: 0,
                data: newCategoryHomepage
            });
        } catch (error) {
            console.error('Error saving category homepage:', error);
            return res.status(500).json({
                errorCode: 6,
                message: 'An error occurred while saving the category homepage',
                details: error.message
            });
        }
    });
};

const getAllCategoryHomepages = async (req, res) => {
    try {
        const categories = await categoryHomepage.find();
        return res.status(200).json({
            errorCode: 0,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({
            errorCode: 6,
            message: 'An error occurred while fetching the categories',
            details: error.message
        });
    }
};
const getCategoryHomepageByCategory = async (req, res) => {
    try {
        const { category } = req.body; // Get the category from the request body

        if (!category) {
            return res.status(400).json({
                errorCode: 5,
                message: 'Category is required'
            });
        }

        const normalizedCategory = category.toLowerCase(); // Normalize the input category to lowercase

        // Use case-insensitive regular expression for the query
        const categoriesData = await categoryHomepage.find({
            category: { $regex: new RegExp(`^${normalizedCategory}$`, 'i') }
        });

        if (categoriesData.length === 0) {
            return res.status(404).json({
                errorCode: 7,
                message: 'No categories found'
            });
        }

        return res.status(200).json({
            errorCode: 0,
            data: categoriesData
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({
            errorCode: 6,
            message: 'An error occurred while fetching the categories',
            details: error.message
        });
    }
};


module.exports = {postImageCategoryHomePage,getAllCategoryHomepages,getCategoryHomepageByCategory}