# 🏋️ FitLog – Health & Fitness Tracker

Dynamic Web Applications – Final Lab Assignment

A Node.js + Express + EJS web application that allows users to log and track their workouts, view recent activity on a dashboard, search past workouts, and check live weather conditions to support outdoor exercise decisions.  
This project consolidates the techniques covered across Labs 1–9, with a focus on backend development and database integration.

## ⚙️ Features

Feature | Description | Key Files
--- | --- | ---
User Authentication | Users can sign up, log in, and log out using secure password hashing and sessions | routes/auth.js, views/login.ejs, views/signup.ejs
Workout Logging | Users can add workouts including exercise type, duration, date, and notes | add-workout.ejs, routes/main.js
Dashboard | Displays recent workouts and summary information in a responsive grid layout | index.ejs, styles.css
Search | Users can search workouts stored in the database | search.ejs, routes/main.js
Weather Lookup | Users can search for a city to view current weather conditions via an external API | routes/weather.js, weather.ejs
Database Persistence | User and workout data stored in a MySQL database | create_db.sql, insert_test_data.sql
Responsive Styling | Custom CSS styling with sidebar navigation and dashboard layout | public/css/styles.css
Deployment | Application deployed on the Goldsmiths virtual server | index.js

---

## 🗄️ Database

The application uses a MySQL database called `health` with the following core tables:

- `users` – stores registered users with hashed passwords
- `workouts` – stores workout entries linked to users

Database setup scripts:
- `create_db.sql`
- `insert_test_data.sql`

A default user is inserted.

---

## 🚀 How to Run the App

Install dependencies:
```bash
npm install

Create the database and insert test data:

mysql -u health_app -p health < create_db.sql
mysql -u health_app -p health < insert_test_data.sql

Start the server locally:

node index.js

The app will run at:
http://localhost:8000