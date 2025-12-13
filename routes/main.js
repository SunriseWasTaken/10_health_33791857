const express = require("express");
const https = require("https");
const router = express.Router();

// home / dashboard
router.get("/", async (req, res) => {
  try {
    // Get recent workouts for dashboard (Lab 6abc pattern)
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
router.get("/workouts", async (req, res) => {
  try {
    // Query workouts from database (Lab 6abc pattern)
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
router.get("/add-workout", (req, res) => {
  res.render("add-workout", {
    pageTitle: "Log Workout",
    current: "add",
    user: req.session.user || null
  });
});

// handle form POST
router.post("/add-workout", async (req, res) => {
  const { exercise, duration, date, notes } = req.body;
  
  try {
    // Insert workout into database using prepared statement (Lab 6abc pattern)
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
router.get("/search", (req, res) => {
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
    // Search workouts using LIKE pattern (Lab 6e pattern)
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

// weather page
router.get("/weather", (req, res) => {
  const weatherData = req.session.weatherData || null;
  const city = req.session.weatherCity || null;
  const error = req.session.weatherError || null;
  
  // Clear session data after displaying
  delete req.session.weatherData;
  delete req.session.weatherCity;
  delete req.session.weatherError;
  
  res.render("weather", {
    pageTitle: "Weather",
    current: "weather",
    user: req.session.user || null,
    weather: weatherData,
    city: city,
    error: error
  });
});

// handle weather form POST
router.post("/weather", (req, res) => {
  const city = req.body.city?.trim();
  
  // Clear previous session data
  delete req.session.weatherData;
  delete req.session.weatherCity;
  delete req.session.weatherError;
  
  if (!city) {
    req.session.weatherError = "Please enter a city name";
    return res.redirect("/weather");
  }
  
  const apiKey = process.env.WEATHER_API_KEY;
  
  if (!apiKey) {
    req.session.weatherError = "Weather API key not configured. Please set WEATHER_API_KEY in .env file";
    return res.redirect("/weather");
  }
  
  // OpenWeatherMap API endpoint (Lab 9a format)
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&APPID=${apiKey}&units=metric`;
  
  https.get(url, (apiRes) => {
    let data = '';
    
    apiRes.on('data', (chunk) => {
      data += chunk;
    });
    
    apiRes.on('end', () => {
      try {
        const weatherJson = JSON.parse(data);
        
        if (apiRes.statusCode === 200 && weatherJson.cod === 200) {
          // Success - format weather data
          const weatherData = {
            location: weatherJson.name + ', ' + (weatherJson.sys.country || ''),
            temperature: Math.round(weatherJson.main.temp),
            condition: weatherJson.weather[0].main,
            description: weatherJson.weather[0].description,
            feelsLike: Math.round(weatherJson.main.feels_like),
            humidity: weatherJson.main.humidity,
            windSpeed: weatherJson.wind?.speed || 0
          };
          
          // Store in session and redirect
          req.session.weatherData = weatherData;
          req.session.weatherCity = city;
          res.redirect("/weather");
        } else {
          // API returned error
          const errorMsg = weatherJson.message || "City not found";
          req.session.weatherError = errorMsg;
          res.redirect("/weather");
        }
      } catch (parseError) {
        req.session.weatherError = "Failed to parse weather data";
        res.redirect("/weather");
      }
    });
  }).on('error', (err) => {
    // Network or request error
    req.session.weatherError = "Failed to fetch weather data: " + err.message;
    res.redirect("/weather");
  });
});

module.exports = router;
