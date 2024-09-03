const express = require('express');
const configViewEngine = require('./config/ViewEngine');
const cors = require('cors');
require('dotenv').config();
const connection = require('./config/database');
const { routerApi, ApiNodejs } = require('./routes/api');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const doLoginWGoogle = require('./controller/social/GoogleController');

const app = express();
const port = process.env.PORT || 8888;
const hostname = process.env.HOST_NAME || 'localhost';

// Configure request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure session middleware
app.use(session({
  secret: 'your-secret-key', // Replace with your secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session()); // Enable passport session support

// Configure CORS
app.use(cors({
  origin: 'http://localhost:6969',
  credentials: true,
}));

// Use your view engine configuration if rendering views
configViewEngine(app);

// API routes
app.use('/v1/api/', routerApi);
app.use('/', ApiNodejs);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Connect to the database and start the server
(async () => {
  try {
    await connection();
    doLoginWGoogle();
    app.listen(port, hostname, () => {
      console.log(`Backend app listening on http://${hostname}:${port}`);
    });

  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
})();