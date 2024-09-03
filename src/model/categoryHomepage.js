const mongoose = require('mongoose');

const categoryHomepageSchema = new mongoose.Schema({
    category: {
        type: String,
        required: [true,' category is required'],
    },
    description: {
        type: String,
        required: [true, 'description is required']
    },
    mainImage: [{
        type: String
    }]
}, { timestamps: true });

const categoryHomepage = mongoose.model('categoryHomepage', categoryHomepageSchema);
module.exports = categoryHomepage;
