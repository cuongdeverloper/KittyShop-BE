const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const mongoose_delete = require('mongoose-delete');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: function() { return !this.socialLogin; }, // Required if not social login
        unique: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address']
    },
    password: {
        type: String,
        required: function() { return !this.socialLogin; } // Required if not social login
    },
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        default: 'USER'
    },
    sex: {
        type: String,
        required: function() { return !this.socialLogin; } // Required if not social login
    },
    phoneNumber: {
        type: String,
        required: function() { return !this.socialLogin; } // Required if not social login
    },
    profileImage: [{
        type: String,
    }],
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    type: {
        type: String,
        default: 'Local'
    },
    socialLogin: {
        type: Boolean,
        default: false
    },
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        size: {
            type: String, // You can change the type based on how you want to store size (e.g., Number if using numeric sizes)
            required: true // Make this field required if all cart items must have a size
        }
    }]
});

userSchema.plugin(mongoose_delete);

userSchema.pre('save', async function (next) {
    if (!this.socialLogin && (this.isModified('password') || this.isNew)) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
