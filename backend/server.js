const express = require('express');
const dotenv = require('dotenv');
// Load environment variables right at the top
dotenv.config();

const path = require('path');
const fs = require('fs');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes');
const ngoRoutes = require('./routes/ngoRoutes.js');
const donationRoutes = require('./routes/donationRoutes.js');
const chatbotRoutes = require('./routes/chatbotRoutes.js');
const ngoResourceRoutes = require('./routes/ngoResourceRoutes.js');
const predictionRoutes = require('./routes/predictionRoutes.js');
const validationRoutes = require('./routes/validationRoutes.js');
const resourceRoutes = require('./routes/resourceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes.js'); // Import the new analytics routes
const contactRoutes = require('./routes/contactRoutes.js'); // Import contact routes

// ... other imports


// --- Create uploads directory if it doesn't exist ---
// This ensures that multer has a place to save the files.
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log(`Created directory: ${uploadsDir}`);
}

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO and attach it to the server
const io = require('./socket').init(server);
io.on('connection', (socket) => {
  console.log('Client connected to WebSocket:', socket.id);
});

// --- FIX: Use a more specific CORS configuration for development ---
const corsOptions = {
  origin: 'http://localhost:3000', // Your frontend's origin
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json()); // To accept JSON data in the body

// --- Make the 'uploads' folder publicly accessible ---
// This serves files from the 'uploads' directory at the '/uploads' URL path.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/donate', donationRoutes);
app.use('/api/ngo-resources', ngoResourceRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/predict', predictionRoutes);
app.use('/api/validate', validationRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/analytics', analyticsRoutes); // Use the new analytics routes
app.use('/api/contact', contactRoutes); // Use the new contact routes

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
