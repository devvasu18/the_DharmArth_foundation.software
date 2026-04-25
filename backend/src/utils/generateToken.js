const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '2h', // Short expiry to prevent "Zombie Sessions"
    });
};

module.exports = generateToken;
