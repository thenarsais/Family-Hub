import request from 'supertest';
import express from 'express';

jest.mock('../../services/merriam-webster', () => ({
  getWordDefinition: jest.fn(),
  getWordOfTheDay: jest.fn(),
  searchWordsByPrefix: jest.fn(),
}));
jest.mock('../../services/openweather', () => ({
  getCurrentWeatherByCity: jest.fn(),
  getCurrentWeatherByCoords: jest.fn(),
  getForecast: jest.fn(),
  isWeatherSuitable: jest.fn(),
}));
jest.mock('../../services/sendgrid', () => ({
  sendAchievementEmail: jest.fn(),
  sendPointsEmail: jest.fn(),
  sendDailySummaryEmail: jest.fn(),
  sendParentNotificationEmail: jest.fn(),
}));

import * as mw from '../../services/merriam-webster';
import * as weather from '../../services/openweather';
import * as sendgrid from '../../services/sendgrid';
import externalApiRoutes from '../../routes/external-apis';

const app = express();
app.use(express.json());
app.use('/api/external', externalApiRoutes);

const AUTH = 'Bearer test-token';

describe('External APIs Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should reject requests without a Bearer token', async () => {
    const res = await request(app).get('/api/external/dictionary/word/cat').expect(401);
    expect(res.body.error).toBe('Missing authorization header');
  });

  describe('GET /dictionary/word/:word', () => {
    it('should return 404 when no definition is found', async () => {
      (mw.getWordDefinition as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app).get('/api/external/dictionary/word/zzzz').set('Authorization', AUTH).expect(404);
      expect(res.body.error).toContain('zzzz');
    });

    it('should return the definition', async () => {
      (mw.getWordDefinition as jest.Mock).mockResolvedValueOnce({ word: 'cat', definitions: [] });

      const res = await request(app).get('/api/external/dictionary/word/cat').set('Authorization', AUTH).expect(200);
      expect(res.body.word).toBe('cat');
    });

    it('should return 500 on service failure', async () => {
      (mw.getWordDefinition as jest.Mock).mockRejectedValueOnce(new Error('down'));

      const res = await request(app).get('/api/external/dictionary/word/cat').set('Authorization', AUTH).expect(500);
      expect(res.body.error).toBe('Failed to get word definition');
    });
  });

  describe('GET /dictionary/word-of-day', () => {
    it('should return 503 when unavailable', async () => {
      (mw.getWordOfTheDay as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app).get('/api/external/dictionary/word-of-day').set('Authorization', AUTH).expect(503);
      expect(res.body.error).toBe('Unable to fetch word of the day');
    });

    it('should return the word of the day', async () => {
      (mw.getWordOfTheDay as jest.Mock).mockResolvedValueOnce({ word: 'serendipity' });

      const res = await request(app).get('/api/external/dictionary/word-of-day').set('Authorization', AUTH).expect(200);
      expect(res.body.word).toBe('serendipity');
      expect(res.body.message).toBe('Word of the Day');
    });

    it('should return 500 on service failure', async () => {
      (mw.getWordOfTheDay as jest.Mock).mockRejectedValueOnce(new Error('down'));

      const res = await request(app).get('/api/external/dictionary/word-of-day').set('Authorization', AUTH).expect(500);
      expect(res.body.error).toBe('Failed to get word of the day');
    });
  });

  describe('GET /dictionary/search', () => {
    it('should require a prefix of at least 2 characters', async () => {
      const res = await request(app).get('/api/external/dictionary/search?prefix=a').set('Authorization', AUTH).expect(400);
      expect(res.body.error).toBe('Prefix must be at least 2 characters');
    });

    it('should default the limit to 10', async () => {
      (mw.searchWordsByPrefix as jest.Mock).mockResolvedValueOnce(['cat', 'catalog']);

      const res = await request(app).get('/api/external/dictionary/search?prefix=cat').set('Authorization', AUTH).expect(200);

      expect(mw.searchWordsByPrefix).toHaveBeenCalledWith('cat', 10);
      expect(res.body.count).toBe(2);
    });

    it('should return 500 on service failure', async () => {
      (mw.searchWordsByPrefix as jest.Mock).mockRejectedValueOnce(new Error('down'));

      const res = await request(app).get('/api/external/dictionary/search?prefix=cat').set('Authorization', AUTH).expect(500);
      expect(res.body.error).toBe('Failed to search words');
    });
  });

  describe('GET /weather/city/:city', () => {
    it('should return 404 when weather is unavailable', async () => {
      (weather.getCurrentWeatherByCity as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app).get('/api/external/weather/city/Nowhere').set('Authorization', AUTH).expect(404);
      expect(res.body.error).toContain('Nowhere');
    });

    it('should return the weather', async () => {
      (weather.getCurrentWeatherByCity as jest.Mock).mockResolvedValueOnce({ location: 'Seattle', temperature: 18 });

      const res = await request(app).get('/api/external/weather/city/Seattle').set('Authorization', AUTH).expect(200);
      expect(res.body.location).toBe('Seattle');
    });

    it('should return 500 on service failure', async () => {
      (weather.getCurrentWeatherByCity as jest.Mock).mockRejectedValueOnce(new Error('down'));

      const res = await request(app).get('/api/external/weather/city/Seattle').set('Authorization', AUTH).expect(500);
      expect(res.body.error).toBe('Failed to get weather');
    });
  });

  describe('GET /weather/coords', () => {
    it('should require valid lat/lon', async () => {
      const res = await request(app).get('/api/external/weather/coords?lat=abc&lon=xyz').set('Authorization', AUTH).expect(400);
      expect(res.body.error).toBe('Valid lat and lon coordinates required');
    });

    it('should return 503 when weather is unavailable', async () => {
      (weather.getCurrentWeatherByCoords as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app).get('/api/external/weather/coords?lat=47.6&lon=-122.3').set('Authorization', AUTH).expect(503);
      expect(res.body.error).toBe('Unable to fetch weather data');
    });

    it('should return the weather', async () => {
      (weather.getCurrentWeatherByCoords as jest.Mock).mockResolvedValueOnce({ location: '47.6, -122.3' });

      const res = await request(app).get('/api/external/weather/coords?lat=47.6&lon=-122.3').set('Authorization', AUTH).expect(200);
      expect(weather.getCurrentWeatherByCoords).toHaveBeenCalledWith(47.6, -122.3);
      expect(res.body.location).toBe('47.6, -122.3');
    });
  });

  describe('GET /weather/forecast/:city', () => {
    it('should return 404 when there is no forecast', async () => {
      (weather.getForecast as jest.Mock).mockResolvedValueOnce([]);

      const res = await request(app).get('/api/external/weather/forecast/Nowhere').set('Authorization', AUTH).expect(404);
      expect(res.body.error).toContain('Nowhere');
    });

    it('should return the forecast', async () => {
      (weather.getForecast as jest.Mock).mockResolvedValueOnce([{ date: '1/1' }, { date: '1/2' }]);

      const res = await request(app).get('/api/external/weather/forecast/Seattle').set('Authorization', AUTH).expect(200);
      expect(res.body.days).toBe(2);
    });

    it('should return 500 on service failure', async () => {
      (weather.getForecast as jest.Mock).mockRejectedValueOnce(new Error('down'));

      const res = await request(app).get('/api/external/weather/forecast/Seattle').set('Authorization', AUTH).expect(500);
      expect(res.body.error).toBe('Failed to get forecast');
    });
  });

  describe('POST /weather/activity-suitability', () => {
    it('should require city and activityType', async () => {
      const res = await request(app)
        .post('/api/external/weather/activity-suitability')
        .set('Authorization', AUTH)
        .send({})
        .expect(400);
      expect(res.body.error).toBe('City and activityType are required');
    });

    it('should return 404 when weather is unavailable', async () => {
      (weather.getCurrentWeatherByCity as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/external/weather/activity-suitability')
        .set('Authorization', AUTH)
        .send({ city: 'Nowhere', activityType: 'hiking' })
        .expect(404);
      expect(res.body.error).toContain('Nowhere');
    });

    it('should return the suitability result', async () => {
      const weatherData = { location: 'Seattle', temperature: 20 };
      (weather.getCurrentWeatherByCity as jest.Mock).mockResolvedValueOnce(weatherData);
      (weather.isWeatherSuitable as jest.Mock).mockReturnValueOnce({ suitable: true, reason: 'Great!' });

      const res = await request(app)
        .post('/api/external/weather/activity-suitability')
        .set('Authorization', AUTH)
        .send({ city: 'Seattle', activityType: 'hiking' })
        .expect(200);

      expect(res.body.suitability).toEqual({ suitable: true, reason: 'Great!' });
    });

    it('should return 500 on service failure', async () => {
      (weather.getCurrentWeatherByCity as jest.Mock).mockRejectedValueOnce(new Error('down'));

      const res = await request(app)
        .post('/api/external/weather/activity-suitability')
        .set('Authorization', AUTH)
        .send({ city: 'Seattle', activityType: 'hiking' })
        .expect(500);
      expect(res.body.error).toBe('Failed to check activity suitability');
    });
  });

  describe('POST /email/achievement', () => {
    const body = { email: 'a@b.com', userName: 'Sam', badgeTitle: 'Early Bird', badgeEmoji: '🐦' };

    it('should require all fields', async () => {
      const res = await request(app).post('/api/external/email/achievement').set('Authorization', AUTH).send({}).expect(400);
      expect(res.body.error).toBe('Missing required fields');
    });

    it('should send the email', async () => {
      (sendgrid.sendAchievementEmail as jest.Mock).mockResolvedValueOnce({ success: true, messageId: 'm1' });

      const res = await request(app).post('/api/external/email/achievement').set('Authorization', AUTH).send(body).expect(201);
      expect(res.body.messageId).toBe('m1');
    });

    it('should return 500 when the send fails', async () => {
      (sendgrid.sendAchievementEmail as jest.Mock).mockResolvedValueOnce({ success: false, error: 'bad key' });

      const res = await request(app).post('/api/external/email/achievement').set('Authorization', AUTH).send(body).expect(500);
      expect(res.body.message).toBe('bad key');
    });

    it('should return 500 on thrown error', async () => {
      (sendgrid.sendAchievementEmail as jest.Mock).mockRejectedValueOnce(new Error('down'));

      const res = await request(app).post('/api/external/email/achievement').set('Authorization', AUTH).send(body).expect(500);
      expect(res.body.error).toBe('Failed to send achievement email');
    });
  });

  describe('POST /email/points', () => {
    const body = { email: 'a@b.com', userName: 'Sam', points: 25, activity: 'Chores' };

    it('should require all fields', async () => {
      const res = await request(app).post('/api/external/email/points').set('Authorization', AUTH).send({}).expect(400);
      expect(res.body.error).toBe('Missing required fields');
    });

    it('should send the email', async () => {
      (sendgrid.sendPointsEmail as jest.Mock).mockResolvedValueOnce({ success: true, messageId: 'm1' });

      const res = await request(app).post('/api/external/email/points').set('Authorization', AUTH).send(body).expect(201);
      expect(res.body.messageId).toBe('m1');
    });

    it('should return 500 when the send fails', async () => {
      (sendgrid.sendPointsEmail as jest.Mock).mockResolvedValueOnce({ success: false, error: 'bad key' });

      const res = await request(app).post('/api/external/email/points').set('Authorization', AUTH).send(body).expect(500);
      expect(res.body.message).toBe('bad key');
    });
  });

  describe('POST /email/daily-summary', () => {
    const body = { email: 'a@b.com', userName: 'Sam', dailyPoints: 25, badgesEarned: 2, streakDays: 5 };

    it('should require required fields', async () => {
      const res = await request(app).post('/api/external/email/daily-summary').set('Authorization', AUTH).send({}).expect(400);
      expect(res.body.error).toBe('Missing required fields');
    });

    it('should default streakDays to 0 when absent', async () => {
      (sendgrid.sendDailySummaryEmail as jest.Mock).mockResolvedValueOnce({ success: true, messageId: 'm1' });

      await request(app)
        .post('/api/external/email/daily-summary')
        .set('Authorization', AUTH)
        .send({ email: 'a@b.com', userName: 'Sam', dailyPoints: 25, badgesEarned: 2 })
        .expect(201);

      expect(sendgrid.sendDailySummaryEmail).toHaveBeenCalledWith('a@b.com', 'Sam', 25, 2, 0);
    });

    it('should send the email', async () => {
      (sendgrid.sendDailySummaryEmail as jest.Mock).mockResolvedValueOnce({ success: true, messageId: 'm1' });

      const res = await request(app).post('/api/external/email/daily-summary').set('Authorization', AUTH).send(body).expect(201);
      expect(res.body.messageId).toBe('m1');
    });

    it('should return 500 when the send fails', async () => {
      (sendgrid.sendDailySummaryEmail as jest.Mock).mockResolvedValueOnce({ success: false, error: 'bad key' });

      const res = await request(app).post('/api/external/email/daily-summary').set('Authorization', AUTH).send(body).expect(500);
      expect(res.body.message).toBe('bad key');
    });
  });

  describe('POST /email/parent-notification', () => {
    const body = { email: 'p@b.com', parentName: 'Jo', childName: 'Sam', pointsEarned: 25, badgesEarned: 2 };

    it('should require required fields', async () => {
      const res = await request(app).post('/api/external/email/parent-notification').set('Authorization', AUTH).send({}).expect(400);
      expect(res.body.error).toBe('Missing required fields');
    });

    it('should default badgesEarned to 0 when absent', async () => {
      (sendgrid.sendParentNotificationEmail as jest.Mock).mockResolvedValueOnce({ success: true, messageId: 'm1' });

      await request(app)
        .post('/api/external/email/parent-notification')
        .set('Authorization', AUTH)
        .send({ email: 'p@b.com', parentName: 'Jo', childName: 'Sam', pointsEarned: 25 })
        .expect(201);

      expect(sendgrid.sendParentNotificationEmail).toHaveBeenCalledWith('p@b.com', 'Jo', 'Sam', 25, 0);
    });

    it('should send the email', async () => {
      (sendgrid.sendParentNotificationEmail as jest.Mock).mockResolvedValueOnce({ success: true, messageId: 'm1' });

      const res = await request(app).post('/api/external/email/parent-notification').set('Authorization', AUTH).send(body).expect(201);
      expect(res.body.messageId).toBe('m1');
    });

    it('should return 500 when the send fails', async () => {
      (sendgrid.sendParentNotificationEmail as jest.Mock).mockResolvedValueOnce({ success: false, error: 'bad key' });

      const res = await request(app).post('/api/external/email/parent-notification').set('Authorization', AUTH).send(body).expect(500);
      expect(res.body.message).toBe('bad key');
    });

    it('should return 500 on thrown error', async () => {
      (sendgrid.sendParentNotificationEmail as jest.Mock).mockRejectedValueOnce(new Error('down'));

      const res = await request(app).post('/api/external/email/parent-notification').set('Authorization', AUTH).send(body).expect(500);
      expect(res.body.error).toBe('Failed to send parent notification email');
    });
  });
});
