const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose')
require('express')
require('dotenv').config()

const connection = async () => {
    try {
        await mongoose.connect(process.env.DB_URI)
        console.log("mongodb connected successfully")
    }
    catch (e) {
        console.log("mongodb connection failed", e)
    }
}

module.exports = { connection }