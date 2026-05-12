import request from 'supertest';
import { httpServer } from '../src/app';

describe('Health endpoint', () => {
  afterAll((done) => {
    httpServer.close(done);
  });

  it('should return status ok', async () => {
    const res = await request(httpServer).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
