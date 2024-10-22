const multer = require('multer');
const path = require('path');
const User = require('../model/user');
const bcrypt = require('bcrypt');
const fs = require('fs');
const uploadCloud = require('../config/cloudinaryConfig');

// Ensure uploads directory exists
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

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
}).array('images', 10); // Accept up to 10 images at a time

// Get all users
const getUserApi = async (req, res) => {
    try {
        const result = await User.find({});
        return res.status(200).json({
            errorCode: 0,
            data: result
        });
    } catch (error) {
        console.error('Error retrieving users:', error);
        return res.status(500).json({
            errorCode: 3,
            message: 'An error occurred while retrieving users'
        });
    }
};
const getUserWithPagination = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 users per page

        // Calculate total number of users
        const totalUsers = await User.countDocuments({});
        const totalPages = Math.ceil(totalUsers / limit);

        // Calculate the number of users to skip for pagination
        const skip = (page - 1) * limit;

        // Fetch users with pagination
        const users = await User.find({})
            .skip(skip)
            .limit(limit);

        // Return paginated users along with pagination info
        return res.status(200).json({
            errorCode: 0,
            data: {
                users,           // Array of user objects
                currentPage: page,   // Current page number
                totalPages,      // Total number of pages
                totalUsers,      // Total number of users
            }
        });
    } catch (error) {
        console.error('Error retrieving users with pagination:', error);
        return res.status(500).json({
            errorCode: 3,
            message: 'An error occurred while retrieving users'
        });
    }
};
// Create a new user
const postCreateUserApi = async (req, res) => {
    uploadCloud.array('profileImage', 10)(req, res, async (err) => {
        // Handle any multer/cloudinary upload errors
        if (err) {
            return res.status(400).json({
                errorCode: 4,
                message: `Upload Error: ${err.message}`
            });
        }

        const { email, password, name, role = 'USER', sex, phoneNumber } = req.body;
        const profileImage = req.files ? req.files.map(file => file.path) : [];

        // Check if required fields are missing
        if (!email || !password || !name || !sex || !phoneNumber) {
            return res.status(400).json({
                errorCode: 5,
                message: 'All fields are required'
            });
        }

        // Validate password strength
        const passwordPattern = /^(?=.*[A-Z]).{6,}$/;
        if (!passwordPattern.test(password)) {
            return res.status(400).json({
                errorCode: 2,
                message: 'Password must be at least 6 characters long and contain at least one uppercase letter'
            });
        }

        try {
            // Check if email already exists
            let existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    errorCode: 1,
                    message: 'Email already exists'
                });
            }

            // Create a new user instance
            let userNew = new User({
                email,
                password,
                name,
                role,
                sex,
                profileImage,
                phoneNumber
            });

            // Save the new user to the database
            await userNew.save();

            // Return success response
            return res.status(200).json({
                errorCode: 0,
                data: userNew
            });

        } catch (saveError) {
            console.error('Error saving user:', saveError);
            return res.status(500).json({
                errorCode: 6,
                message: 'An error occurred while saving the user'
            });
        }
    });
};



// Delete a user by ID
const deleteUserApi = async (req, res) => {
    try {
        const userId = req.body.id;

        if (!userId) {
            return res.status(400).json({
                errorCode: 1,
                message: 'User ID is required'
            });
        }

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({
                errorCode: 2,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            errorCode: 0,
            data: deletedUser,
            message:'Delete success'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({
            errorCode: 3,
            message: 'An error occurred while deleting the user'
        });
    }
};

// Update a user by ID
const updateUserApi = async (req, res) => {
    uploadCloud.single('profileImage')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                errorCode: 4,
                message: err.message
            });
        }

        const { id, name, role, sex, phoneNumber } = req.body;
        const profileImage = req.file ? req.file.path : null;

        if (!id || !name || !sex || !phoneNumber) {
            return res.status(400).json({
                errorCode: 5,
                message: 'All fields are required'
            });
        }

        try {
            const updatedUser = await User.findByIdAndUpdate(
                id,
                { name, role, sex, phoneNumber, ...(profileImage && { profileImage }) },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({
                    errorCode: 2,
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                errorCode: 0,
                data: updatedUser,
                message: 'Update successful'
            });
        } catch (updateError) {
            console.error('Error updating user:', updateError);
            return res.status(500).json({
                errorCode: 6,
                message: 'An error occurred while updating the user'
            });
        }
    });
};



module.exports = {
    postCreateUserApi,
    getUserApi,
    deleteUserApi,
    updateUserApi,
    getUserWithPagination
};