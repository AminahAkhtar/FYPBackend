const express = require('express');
const Biker = require('../models/Biker');
const Franchiser = require('../models/Franchiser');
const router = express.Router();
const bcrypt = require('bcryptjs')
const {body, validationResult} = require('express-validator')

// Function to calculate the distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);  // Convert degrees to radians
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1) * (Math.PI / 180)) * Math.cos((lat2) * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

// Route to get nearest franchisers based on biker's phone number
router.get('/nearest-franchisers/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;

        // Find the biker based on phone number
        const biker = await Biker.findOne({ phoneNumber });

        if (!biker) {
            return res.status(404).json({ error: 'Biker not found' });
        }

        // Ensure that the biker's location data exists and is not null
        if (!biker.location || !biker.location.coordinates) {
            return res.status(400).json({ error: 'Biker location data is missing or invalid' });
        }

        // Retrieve latitude and longitude of the biker
        const bikerLatitude = biker.location.coordinates[1];
        const bikerLongitude = biker.location.coordinates[0];

       // Find nearest franchisers based on biker's location
       const franchisers = await Franchiser.find({});

       // Calculate distances and filter nearest franchisers
       const nearestFranchisers = franchisers.filter(franchiser => {
           const distance = calculateDistance(
               bikerLatitude,
               bikerLongitude,
               franchiser.location.coordinates[1],
               franchiser.location.coordinates[0]
           );
           return distance < 500; // Considering franchisers within 500 kilometers
       });

       const simplifiedFranchisers = nearestFranchisers.map(franchiser => {
        const distance = calculateDistance(
            bikerLatitude,
            bikerLongitude,
            franchiser.location.coordinates[1],
            franchiser.location.coordinates[0]
        );
    
        return {
            name: franchiser.name,
            coordinates: franchiser.location.coordinates,
            distance: distance.toFixed(2) // Convert distance to fixed decimal places
        };
    });
    
    return res.json({ nearestFranchisers: simplifiedFranchisers });
    } catch (error) {
        console.error('Error finding nearest franchisers:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router