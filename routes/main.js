const express = require("express");
const https = require("https");
const router = express.Router();

const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect("./login"); // redirect to the login page
  } else {
    next(); // move to the next middleware function
  }
};

// home / dashboard
router.get("/", async (req, res) => {
  try {
    const [recentWorkouts] = await req.app.locals.db.execute(
      'SELECT * FROM workouts ORDER BY workout_date DESC, created_at DESC LIMIT 5'
    );
    
    res.render("index", {
      pageTitle: "Dashboard",
      current: "home",
      user: req.session.user || null,
      recentWorkouts: recentWorkouts || []
    });
  } catch (err) {
    console.error('Error fetching recent workouts:', err);
    res.render("index", {
      pageTitle: "Dashboard",
      current: "home",
      user: req.session.user || null,
      recentWorkouts: []
    });
  }
});

// about
router.get("/about", (req, res) => {
  res.render("about", {
    pageTitle: "About",
    current: "about",
    user: req.session.user || null
  });
});

// workouts dashboard
router.get("/workouts", redirectLogin, async (req, res) => {
  try {
    const [workouts] = await req.app.locals.db.execute(
      'SELECT * FROM workouts ORDER BY workout_date DESC, created_at DESC'
    );
    
    res.render("workouts", {
      pageTitle: "My Workouts",
      current: "workouts",
      user: req.session.user || null,
      workouts: workouts
    });
  } catch (err) {
    console.error('Error fetching workouts:', err);
    res.render("workouts", {
      pageTitle: "My Workouts",
      current: "workouts",
      user: req.session.user || null,
      workouts: [],
      error: "Failed to load workouts"
    });
  }
});

// add workout form
router.get("/add-workout", redirectLogin, (req, res) => {
  res.render("add-workout", {
    pageTitle: "Log Workout",
    current: "add",
    user: req.session.user || null
  });
});

// handle form POST
router.post("/add-workout", redirectLogin, async (req, res) => {
  const { exercise, duration, date, notes } = req.body;
  
  try {
    await req.app.locals.db.execute(
      'INSERT INTO workouts (exercise, workout_date, duration, notes) VALUES (?, ?, ?, ?)',
      [exercise, date || new Date().toISOString().split('T')[0], parseInt(duration), notes || null]
    );
    
    res.redirect("/workouts");
  } catch (err) {
    console.error('Error inserting workout:', err);
    // Store error in session and redirect
    req.session.workoutError = "Failed to save workout. Please try again.";
    res.redirect("/add-workout");
  }
});

// search page
router.get("/search", redirectLogin, (req, res) => {
  res.render("search", {
    pageTitle: "Search",
    current: "search",
    user: req.session.user || null,
    searchText: req.query.search_text || null
  });
});

// search results
router.get("/search-results", async (req, res) => {
  const searchText = req.query.search_text?.trim();
  
  if (!searchText) {
    return res.redirect("/search");
  }
  
  try {
    const [workouts] = await req.app.locals.db.execute(
      'SELECT * FROM workouts WHERE exercise LIKE ? OR notes LIKE ? ORDER BY workout_date DESC',
      [`%${searchText}%`, `%${searchText}%`]
    );
    
    res.render("search-results", {
      pageTitle: "Search Results",
      current: "search",
      user: req.session.user || null,
      workouts: workouts,
      searchText: searchText
    });
  } catch (err) {
    console.error('Error searching workouts:', err);
    res.render("search-results", {
      pageTitle: "Search Results",
      current: "search",
      user: req.session.user || null,
      workouts: [],
      searchText: searchText,
      error: "Failed to search workouts"
    });
  }
});

module.exports = router;
