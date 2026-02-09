require('dotenv').config();
const mongoose = require('mongoose');

console.log("Testing MongoDB connection...");
console.log("URI:", process.env.DB_URI ? process.env.DB_URI.replace(/:([^:@]+)@/, ':****@') : "undefined"); // Mask password

mongoose.connect(process.env.DB_URI)
    .then(() => {
        console.log("SUCCESS: MongoDB connected successfully!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("FAILURE: MongoDB connection failed.");
        console.error(err);
        process.exit(1);
    });
