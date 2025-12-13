// Load environment variables
require('dotenv').config();

// imports
const express = require("express");
const session = require("express-session");
const mysql = require("mysql2/promise");

// express application object
const app = express();
const port = process.env.PORT || 8000;

// MySQL connection pool (ready for use)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pulselog',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Make db available to routes
app.locals.db = db;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'pulselog-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// ejs template
app.set('view engine', 'ejs');

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static("public"));

// Make session user available to all views via res.locals
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// routes
const mainRoutes = require("./routes/main");
app.use('/', mainRoutes);

// web app listening
app.listen(port, () => console.log(`App running on port ${port}`))