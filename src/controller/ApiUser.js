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

// Create a new user
const postCreateUserApi = async (req, res) => {
    uploadCloud.array('profileImage', 10)(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                errorCode: 4,
                message: err.message
            });
        }

        const { email, password, name, role = 'USER', sex, phoneNumber } = req.body;
        const profileImage = req.files ? req.files.map(file => file.path) : [];

        if (!email || !password || !name || !sex || !phoneNumber) {
            return res.status(400).json({
                errorCode: 5,
                message: 'All fields are required'
            });
        }

        const passwordPattern = /^(?=.*[A-Z]).{6,}$/;

        if (!passwordPattern.test(password)) {
            return res.status(400).json({
                errorCode: 2,
                message: 'Password must be at least 6 characters long and contain at least one uppercase letter'
            });
        }

        try {
            let existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    errorCode: 1,
                    message: 'Email already exists'
                });
            }

            let userNew = new User({
                email,
                password,
                name,
                role,
                sex,
                profileImage,
                phoneNumber
            });

            await userNew.save();
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
            data: deletedUser
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
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                errorCode: 4,
                message: err.message
            });
        }
        let id = req.body.id;
        let email = req.body.email;
        let name = req.body.name;
        let role = req.body.role;
        let sex = req.body.sex;
        let phoneNumber = req.body.phoneNumber
        const profileImage = req.file ? req.file.path : null;

        if (!id || !email || !name || !sex || !phoneNumber) {
            return res.status(400).json({
                errorCode: 5,
                message: 'All fields are required'
            });
        }

        try {
            const updatedUser = await User.findByIdAndUpdate(
                id,
                { email, name, role, sex, phoneNumber, ...(profileImage && { profileImage }) },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({
                    errorCode: 2,
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                EC: 0,
                data: updatedUser,
                MC: 'Update information success'
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
    updateUserApi
};