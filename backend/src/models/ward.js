const mongoose = require('mongoose');
const { Schema } = mongoose;

const wardSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    // Central point of the ward for map display
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
    // All officers assigned to this ward
    assignedOfficers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

// Create a 2dsphere index for geospatial queries
wardSchema.index({ location: '2dsphere' });

const Ward = mongoose.model('Ward', wardSchema);
module.exports = Ward;