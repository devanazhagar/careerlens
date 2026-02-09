const jwt = require('jsonwebtoken')
require('dotenv').config()


const userauth = async (req, res, next) => {
    let { token } = req.cookies || {};

    // Fallback to Authorization header if cookie is missing
    if (!token && req.headers.authorization) {
        const headerToken = req.headers.authorization.split(' ')[1];
        if (headerToken && headerToken !== 'undefined') {
            token = headerToken;
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized. Please login again to access Career Analysis."
        });
    }
    try {
        const tokendecode = jwt.verify(token, process.env.JWT_PASS);
        if (tokendecode.id) {
            if (!req.body) req.body = {};
            req.body.userID = tokendecode.id
        } else {
            res.status(404).json({
                success: false,
                message: "not authorization , login again"
            })
        }
        next();

    } catch (e) {
        res.status(404).json({
            success: false,
            message: e.message
        })

    }

}

module.exports = userauth