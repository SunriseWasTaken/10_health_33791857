const express = require("express");
const router = express.Router();

const appData = { appName: "Health tracker" };

// home
router.get("/", (req, res) => {
  res.render("index.ejs", appData);
});

// about
router.get("/about", (req, res) => {
  res.render("about.ejs", appData);
});

// workouts dashboard
router.get("/workouts", (req, res) => {
  res.render("workouts.ejs", appData);
});

// add workout form
router.get("/add-workout", (req, res) => {
  res.render("add-workout.ejs", appData);
});

// handle form POST
router.post("/add-workout", (req, res) => {
  const { exercise, duration } = req.body;
  appData.workouts.push({ exercise, duration });
  res.redirect("/workouts");
});

module.exports = router;
