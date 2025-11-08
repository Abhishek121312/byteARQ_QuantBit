const mongoose = require('mongoose');
const { Schema } = mongoose;

const issueSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // --- NEW: Citizen who reported it ---
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // --- NEW: Officer it is assigned to ---
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null // Unassigned initially
    },
    ward: {
        type: Schema.Types.ObjectId,
        ref: 'Ward',
        required: true
    },
    // Location where the issue was reported
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved'],
        default: 'Pending'
    },
    category: {
        type: String,
        enum: ['Lighting', 'Waste', 'Road', 'Other'],
        default: 'Other'
    },
    imageUrl: {
        type: String,
    },
}, { timestamps: true });

// Index for searching issues by location
issueSchema.index({ location: '2dsphere' });

const Issue = mongoose.model('Issue', issueSchema);
module.exports = Issue;