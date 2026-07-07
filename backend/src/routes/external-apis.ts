/**
 * External APIs Routes
 * Exposes Merriam-Webster, OpenWeather, and SendGrid functionality
 */

import express, { Router, Request, Response } from 'express';
import * as mw from '../services/merriam-webster';
import * as weather from '../services/openweather';
import * as sendgrid from '../services/sendgrid';

const router = Router();

// Middleware to verify auth
const verifyAuth = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  next();
};

// ================================================
// MERRIAM-WEBSTER DICTIONARY
// ================================================

/**
 * GET /dictionary/word/:word
 * Get word definition
 */
router.get('/dictionary/word/:word', verifyAuth, async (req: Request, res: Response) => {
  try {
    const word = req.params.word as string;

    if (!word || word.length === 0) {
      return res.status(400).json({ error: 'Word parameter is required' });
    }

    const definition = await mw.getWordDefinition(word);

    if (!definition) {
      return res.status(404).json({ error: `No definition found for word "${word}"` });
    }

    res.json(definition);
  } catch (error: any) {
    console.error('Dictionary error:', error);
    res.status(500).json({
      error: 'Failed to get word definition',
      message: error.message
    });
  }
});

/**
 * GET /dictionary/word-of-day
 * Get word of the day
 */
router.get('/dictionary/word-of-day', verifyAuth, async (req: Request, res: Response) => {
  try {
    const wordOfDay = await mw.getWordOfTheDay();

    if (!wordOfDay) {
      return res.status(503).json({ error: 'Unable to fetch word of the day' });
    }

    res.json({
      message: 'Word of the Day',
      ...wordOfDay
    });
  } catch (error: any) {
    console.error('Word of day error:', error);
    res.status(500).json({
      error: 'Failed to get word of the day',
      message: error.message
    });
  }
});

/**
 * GET /dictionary/search?prefix=...
 * Search words by prefix
 */
router.get('/dictionary/search', verifyAuth, async (req: Request, res: Response) => {
  try {
    const prefix = req.query.prefix as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!prefix || prefix.length < 2) {
      return res.status(400).json({ error: 'Prefix must be at least 2 characters' });
    }

    const words = await mw.searchWordsByPrefix(prefix, limit);

    res.json({
      prefix,
      count: words.length,
      words
    });
  } catch (error: any) {
    console.error('Word search error:', error);
    res.status(500).json({
      error: 'Failed to search words',
      message: error.message
    });
  }
});

// ================================================
// OPENWEATHER
// ================================================

/**
 * GET /weather/city/:city
 * Get current weather for a city
 */
router.get('/weather/city/:city', verifyAuth, async (req: Request, res: Response) => {
  try {
    const city = req.params.city as string;

    if (!city || city.length === 0) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    const weatherData = await weather.getCurrentWeatherByCity(city);

    if (!weatherData) {
      return res.status(404).json({ error: `Weather not found for city "${city}"` });
    }

    res.json(weatherData);
  } catch (error: any) {
    console.error('Weather error:', error);
    res.status(500).json({
      error: 'Failed to get weather',
      message: error.message
    });
  }
});

/**
 * GET /weather/coords?lat=...&lon=...
 * Get current weather by coordinates
 */
router.get('/weather/coords', verifyAuth, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid lat and lon coordinates required' });
    }

    const weatherData = await weather.getCurrentWeatherByCoords(lat, lon);

    if (!weatherData) {
      return res.status(503).json({ error: 'Unable to fetch weather data' });
    }

    res.json(weatherData);
  } catch (error: any) {
    console.error('Weather coords error:', error);
    res.status(500).json({
      error: 'Failed to get weather',
      message: error.message
    });
  }
});

/**
 * GET /weather/forecast/:city
 * Get 5-day forecast
 */
router.get('/weather/forecast/:city', verifyAuth, async (req: Request, res: Response) => {
  try {
    const city = req.params.city as string;

    if (!city || city.length === 0) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    const forecast = await weather.getForecast(city);

    if (!forecast || forecast.length === 0) {
      return res.status(404).json({ error: `Forecast not found for city "${city}"` });
    }

    res.json({
      city,
      days: forecast.length,
      forecast
    });
  } catch (error: any) {
    console.error('Forecast error:', error);
    res.status(500).json({
      error: 'Failed to get forecast',
      message: error.message
    });
  }
});

/**
 * POST /weather/activity-suitability
 * Check if weather is suitable for activity
 */
router.post('/weather/activity-suitability', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { city, activityType } = req.body;

    if (!city || !activityType) {
      return res.status(400).json({ error: 'City and activityType are required' });
    }

    const weatherData = await weather.getCurrentWeatherByCity(city);

    if (!weatherData) {
      return res.status(404).json({ error: `Weather not found for city "${city}"` });
    }

    const suitability = weather.isWeatherSuitable(weatherData, activityType);

    res.json({
      city,
      activityType,
      weather: weatherData,
      suitability
    });
  } catch (error: any) {
    console.error('Activity suitability error:', error);
    res.status(500).json({
      error: 'Failed to check activity suitability',
      message: error.message
    });
  }
});

// ================================================
// SENDGRID EMAIL
// ================================================

/**
 * POST /email/achievement
 * Send achievement notification email
 */
router.post('/email/achievement', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { email, userName, badgeTitle, badgeEmoji } = req.body;

    if (!email || !userName || !badgeTitle || !badgeEmoji) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'userName', 'badgeTitle', 'badgeEmoji']
      });
    }

    const result = await sendgrid.sendAchievementEmail(email, userName, badgeTitle, badgeEmoji);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to send email',
        message: result.error
      });
    }

    res.status(201).json({
      message: 'Achievement email sent successfully',
      messageId: result.messageId
    });
  } catch (error: any) {
    console.error('Achievement email error:', error);
    res.status(500).json({
      error: 'Failed to send achievement email',
      message: error.message
    });
  }
});

/**
 * POST /email/points
 * Send points earned notification
 */
router.post('/email/points', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { email, userName, points, activity } = req.body;

    if (!email || !userName || !points || !activity) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'userName', 'points', 'activity']
      });
    }

    const result = await sendgrid.sendPointsEmail(email, userName, points, activity);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to send email',
        message: result.error
      });
    }

    res.status(201).json({
      message: 'Points email sent successfully',
      messageId: result.messageId
    });
  } catch (error: any) {
    console.error('Points email error:', error);
    res.status(500).json({
      error: 'Failed to send points email',
      message: error.message
    });
  }
});

/**
 * POST /email/daily-summary
 * Send daily summary email
 */
router.post('/email/daily-summary', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { email, userName, dailyPoints, badgesEarned, streakDays } = req.body;

    if (!email || !userName || dailyPoints === undefined || badgesEarned === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'userName', 'dailyPoints', 'badgesEarned', 'streakDays']
      });
    }

    const result = await sendgrid.sendDailySummaryEmail(
      email,
      userName,
      dailyPoints,
      badgesEarned,
      streakDays || 0
    );

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to send email',
        message: result.error
      });
    }

    res.status(201).json({
      message: 'Daily summary email sent successfully',
      messageId: result.messageId
    });
  } catch (error: any) {
    console.error('Daily summary email error:', error);
    res.status(500).json({
      error: 'Failed to send daily summary email',
      message: error.message
    });
  }
});

/**
 * POST /email/parent-notification
 * Send parent notification about child's progress
 */
router.post('/email/parent-notification', verifyAuth, async (req: Request, res: Response) => {
  try {
    const { email, parentName, childName, pointsEarned, badgesEarned } = req.body;

    if (!email || !parentName || !childName || pointsEarned === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'parentName', 'childName', 'pointsEarned', 'badgesEarned']
      });
    }

    const result = await sendgrid.sendParentNotificationEmail(
      email,
      parentName,
      childName,
      pointsEarned,
      badgesEarned || 0
    );

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to send email',
        message: result.error
      });
    }

    res.status(201).json({
      message: 'Parent notification email sent successfully',
      messageId: result.messageId
    });
  } catch (error: any) {
    console.error('Parent notification email error:', error);
    res.status(500).json({
      error: 'Failed to send parent notification email',
      message: error.message
    });
  }
});

export default router;
