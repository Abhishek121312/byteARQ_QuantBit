const validator = require('validator');

// This is a placeholder. Your old validation was for 'role', which is now fixed.
// You can expand this later.
const validateRegistration = (data) => {
    const { email, password } = data;

    if (!email || !password) {
        throw new Error("Email and password are required fields.");
    }

    if (!validator.isEmail(email)) {
        throw new Error("Invalid email format.");
    }

    // You can re-add strong password validation if you like
    // if (!validator.isStrongPassword(password)) {
    //     throw new Error("Password is not strong enough.");
    // }
};

module.exports = { validateRegistration };