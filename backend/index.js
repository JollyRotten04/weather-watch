const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');

const PORT = 3000;

app.use(cors());

// Weather + Air Quality route
app.get("/weather/:city", async (req, res) => {
  const city = req.params.city || "London";

  const weatherApiKey = process.env.VC_API_KEY;
  const airQualityApiKey = process.env.AIR_QUALITY_API_KEY;

  if (!weatherApiKey || !airQualityApiKey) {
    return res.status(500).json({ error: "Missing API keys" });
  }

  try {
    // 1. Get Weather from Visual Crossing
    const weatherUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}?unitGroup=metric&key=${weatherApiKey}&contentType=json`;
    const weatherRes = await axios.get(weatherUrl);
    const weatherData = weatherRes.data;

    // 2. Get Coordinates from Visual Crossing response
    const lat = weatherData.latitude;
    const lon = weatherData.longitude;

    if (!lat || !lon) {
      return res.status(500).json({ error: "Could not retrieve coordinates for AQI" });
    }

    // 3. Get Air Quality from OpenWeatherMap
    const airUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${airQualityApiKey}`;
    const airRes = await axios.get(airUrl);
    const airData = airRes.data;

    // 4. Merge responses
    const mergedData = {
      city: city,
      weather: weatherData,
      airQuality: airData
    };

    res.json(mergedData);

  } catch (err) {
    console.error("Error fetching data:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch weather/air quality data" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
