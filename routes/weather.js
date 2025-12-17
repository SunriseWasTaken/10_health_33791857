const express = require('express');
const request = require('request');

const router = express.Router();

router.get('/', (req, res) => {
  const city = req.query.city;

  if (!city) {
    return res.render('weather', { city: '', weather: null, error: null });
  }

  const apiKey = process.env.WEATHER_API_KEY;

  if (!apiKey || apiKey === 'your_key_here') {
    return res.render('weather', {
      city,
      weather: null,
      error: 'Weather service is not configured'
    });
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  request(url, (err, response, body) => {
    if (err) {
      return res.render('weather', {
        city,
        weather: null,
        error: 'Unable to connect to weather service'
      });
    }

    if (response.statusCode !== 200) {
      return res.render('weather', {
        city,
        weather: null,
        error: 'Please check the spelling and try again.'
      });
    }

    const data = JSON.parse(body);

    const weather = {
      location: `${data.name}, ${data.sys.country}`,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      condition: data.weather[0].main,
      description: data.weather[0].description
    };

    res.render('weather', {
      city,
      weather,
      error: null
    });
  });
});

module.exports = router;