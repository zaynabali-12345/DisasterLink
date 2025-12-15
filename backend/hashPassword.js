const bcrypt = require('bcrypt');

// Define users and their plain text passwords
const users = [
    { role: "emergency", plainPassword: "Emergency@2025" },
    { role: "volunteer", plainPassword: "Volunteer@2025" },
    { role: "ngo", plainPassword: "NGO@2025" },
    { role: "admin", plainPassword: "admin@2025" }
];

// Hash each password
(async () => {
    for (let user of users) {
        try {
            const hashed = await bcrypt.hash(user.plainPassword, 10);
            console.log(`${user.role} hashed password: ${hashed}`);
        } catch (err) {
            console.error(`Error hashing for ${user.role}:`, err);
        }
    }
})();
