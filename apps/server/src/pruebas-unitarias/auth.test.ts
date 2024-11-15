import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { userRepository, sessionRepository } from '../database';
import { appLog, expressPromise } from '../lib';
import {
  userRegisterRequestSchema,  userUpdateRequestSchema
} from '@qa-assessment/shared';

const app = express();
app.use(express.json());

const router = Router();

router.post(
  '/',
  expressPromise(async (req, res) => {
    appLog('Register attempt');
    const body = userRegisterRequestSchema.safeParse(req.body);

    if (!body.success) {
      appLog('Invalid register request', body.error.errors);
      return res.status(422).json({ errors: body.error.errors });
    }

    await userRepository
      .register(body.data)
      .then((user) => sessionRepository.create(user))
      .then((session) => res.json(session))
      .then(() => appLog('User registered', body.data))
      .then(() => appLog('User logged in', body.data));
  }),
);

app.use('/users', router);

vi.mock('../database', () => ({
  userRepository: {
    find: vi.fn(),
    register: vi.fn(),
    update: vi.fn(),
    clear: vi.fn(),
  },
  sessionRepository: {
    create: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('../lib', () => ({
  appLog: vi.fn(),
  expressPromise: vi.fn((fn) => (req: any, res: any, next: any) => fn(req, res).catch(next)),
}));

describe('Users Router - POST /', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    const userName = { username: 'Lina', password: 'Fito120630+' };
    const buildUser = { ...userName, id: '1' };
    const sessNew = { sessionId: '362' };

    (userRepository.register as jest.Mock).mockResolvedValue(buildUser);
    (sessionRepository.create as jest.Mock).mockResolvedValue(sessNew);

    const response = await request(app)
      .post('/users')
      .send(userName);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(sessNew);
    expect(appLog).toHaveBeenCalledWith('Register attempt');
    expect(appLog).toHaveBeenCalledWith('User registered', userName);
    expect(appLog).toHaveBeenCalledWith('User logged in', userName);
  });

  it('should return 422 for invalid register request', async () => {
    const invalidUser = { username: '', password: 'access405' };

    const response = await request(app)
      .post('/users')
      .send(invalidUser);

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('errors');
    expect(appLog).toHaveBeenCalledWith('Register attempt');
    expect(appLog).toHaveBeenCalledWith('Invalid register request', expect.any(Array));
  });
});