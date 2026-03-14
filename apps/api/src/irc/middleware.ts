import type { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source';
import { AgentToken } from '../entities';

export interface AgentRequest extends Request {
  agent?: AgentToken;
}

export async function requireAgent(req: AgentRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization: Bearer <token> required' });
    return;
  }

  const token = authHeader.slice(7);
  const repo = AppDataSource.getRepository(AgentToken);
  const agent = await repo.findOne({ where: { token } });

  if (!agent) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Update lastSeen
  agent.lastSeen = new Date();
  await repo.save(agent);

  req.agent = agent;
  next();
}
