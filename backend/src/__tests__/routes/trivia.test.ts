import request from 'supertest';
import express from 'express';

const mockTriviaService = {
  getToday: jest.fn(),
  submitToday: jest.fn(),
};

jest.mock('../../services/trivia', () => ({
  ...jest.requireActual('../../services/trivia'),
  getTriviaService: () => mockTriviaService,
}));

import triviaRoutes from '../../routes/trivia';

const app = express();
app.use(express.json());
app.use('/api/trivia', triviaRoutes);

const U = (r: request.Test) => r.set('x-user-id', 'user-1');

const PAYLOAD = {
  question: {
    id: 'q-1',
    question: 'Largest planet?',
    category: 'Space',
    difficulty: 'easy',
    options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
    hint: 'J',
    pointsValue: 10,
  },
  attempt: null,
  streak: 0,
  stats: { answered: 0, correct: 0 },
};

describe('Trivia routes', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('GET /api/trivia/today', () => {
    it('401s without x-user-id', async () => {
      await request(app).get('/api/trivia/today').expect(401);
    });

    it('returns today\'s payload', async () => {
      mockTriviaService.getToday.mockResolvedValueOnce(PAYLOAD);
      const res = await U(request(app).get('/api/trivia/today')).expect(200);
      expect(res.body.status).toBe('success');
      expect(res.body.question.options).toHaveLength(4);
      expect(res.body.streak).toBe(0);
      expect(mockTriviaService.getToday).toHaveBeenCalledWith('user-1');
    });

    it('500s on a service error', async () => {
      mockTriviaService.getToday.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).get('/api/trivia/today')).expect(500);
    });
  });

  describe('POST /api/trivia/today', () => {
    it('401s without x-user-id', async () => {
      await request(app).post('/api/trivia/today').send({ answer: 'Jupiter' }).expect(401);
    });

    it('400s without an answer string', async () => {
      await U(request(app).post('/api/trivia/today')).send({}).expect(400);
      await U(request(app).post('/api/trivia/today')).send({ answer: '   ' }).expect(400);
    });

    it('records the answer and returns the updated payload', async () => {
      mockTriviaService.submitToday.mockResolvedValueOnce({
        ...PAYLOAD,
        attempt: { selectedAnswer: 'Jupiter', isCorrect: true, pointsEarned: 10, correctAnswer: 'Jupiter', funFact: 'x' },
        streak: 1,
      });
      const res = await U(request(app).post('/api/trivia/today')).send({ answer: 'Jupiter' }).expect(200);
      expect(res.body.attempt.isCorrect).toBe(true);
      expect(res.body.streak).toBe(1);
      expect(mockTriviaService.submitToday).toHaveBeenCalledWith('user-1', 'Jupiter');
    });

    it('400s on an answer that is not an option', async () => {
      mockTriviaService.submitToday.mockRejectedValueOnce(new Error('bad-answer'));
      const res = await U(request(app).post('/api/trivia/today')).send({ answer: 'Pluto' }).expect(400);
      expect(res.body.message).toMatch(/not one of the options/i);
    });

    it('503s when there is no question', async () => {
      mockTriviaService.submitToday.mockRejectedValueOnce(new Error('no-question'));
      await U(request(app).post('/api/trivia/today')).send({ answer: 'x' }).expect(503);
    });

    it('500s on an unexpected error', async () => {
      mockTriviaService.submitToday.mockRejectedValueOnce(new Error('db down'));
      await U(request(app).post('/api/trivia/today')).send({ answer: 'x' }).expect(500);
    });
  });
});
