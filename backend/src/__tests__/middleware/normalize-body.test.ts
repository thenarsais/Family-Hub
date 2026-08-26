import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { normalizeBody } from '../../middleware/normalize-body';

describe('normalizeBody', () => {
  describe('unit', () => {
    const run = (body: unknown) => {
      const req = { body } as Request;
      const next = jest.fn();
      normalizeBody(req, {} as Response, next as NextFunction);
      return { req, next };
    };

    it('replaces an undefined body with {}', () => {
      const { req, next } = run(undefined);
      expect(req.body).toEqual({});
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('replaces a null body with {}', () => {
      expect(run(null).req.body).toEqual({});
    });

    it('leaves an existing object untouched (same reference)', () => {
      const obj = { a: 1 };
      expect(run(obj).req.body).toBe(obj);
    });

    it('leaves an array body untouched', () => {
      const arr = [1, 2];
      expect(run(arr).req.body).toBe(arr);
    });

    it('leaves a primitive body untouched', () => {
      expect(run('raw').req.body).toBe('raw');
    });
  });

  describe('wired into a router that destructures req.body before its guards', () => {
    // Mirrors the real pattern in routes/*.ts: read a header, then
    // `const { x } = req.body` before the `if (!userId)` / field checks.
    const makeApp = (withGuard: boolean) => {
      const app = express();
      app.use(express.json());
      const router = express.Router();
      if (withGuard) router.use(normalizeBody);
      router.post('/thing', (req: Request, res: Response) => {
        const userId = req.headers['x-user-id'];
        const { name } = req.body;
        if (!userId) return res.status(401).json({ error: 'user id required' });
        if (!name) return res.status(400).json({ error: 'name required' });
        return res.json({ ok: true });
      });
      app.use('/api', router);
      app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        res.status(500).json({ error: err.message });
      });
      return app;
    };

    it('a bodyless POST 500s WITHOUT the guard (documents the bug)', async () => {
      await request(makeApp(false)).post('/api/thing').expect(500);
    });

    it('a bodyless POST reaches the handler and gets its intended 4xx WITH the guard', async () => {
      await request(makeApp(true)).post('/api/thing').expect(401);
      await request(makeApp(true)).post('/api/thing').set('x-user-id', 'u1').expect(400);
    });

    it('still parses and passes through a real JSON body', async () => {
      await request(makeApp(true))
        .post('/api/thing')
        .set('x-user-id', 'u1')
        .send({ name: 'ok' })
        .expect(200);
    });
  });
});
