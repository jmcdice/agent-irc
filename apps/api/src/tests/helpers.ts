import request from 'supertest';
import { Express } from 'express';
import { expect } from 'vitest';

/**
 * Helper to create authenticated request agent
 */
export function createAuthenticatedAgent(app: Express) {
  return request.agent(app);
}

/**
 * Helper to make GET request
 */
export function get(app: Express, path: string) {
  return request(app).get(path);
}

/**
 * Helper to make POST request with JSON body
 */
export function post(app: Express, path: string, body?: object) {
  const req = request(app).post(path).set('Content-Type', 'application/json');
  if (body) {
    req.send(body);
  }
  return req;
}

/**
 * Verify response is JSON
 */
export function expectJson(response: request.Response) {
  expect(response.headers['content-type']).toMatch(/application\/json/);
}

/**
 * Verify response has expected status
 */
export function expectStatus(response: request.Response, status: number) {
  expect(response.status).toBe(status);
}

