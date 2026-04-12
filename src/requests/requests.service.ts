import { db } from '../_helpers/db';
import { Request, RequestCreationAttributes, RequestStatus } from './request.model';

export const requestsService = { getAll, getMyRequests, getById, create, updateStatus, remove };

async function getAll(): Promise<Request[]> {
  return db.Request.findAll({
    include: [{ association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order:   [['date', 'DESC']],
  });
}

async function getMyRequests(userId: number): Promise<Request[]> {
  return db.Request.findAll({ where: { userId }, order: [['date', 'DESC']] });
}

async function getById(id: number): Promise<Request> {
  return getRequest(id);
}

async function create(params: RequestCreationAttributes, userId: number): Promise<Request> {
  if (!params.items || params.items.length === 0)
    throw 'At least one item is required';
  return db.Request.create({ ...params, userId, status: 'Pending' });
}

async function updateStatus(id: number, status: RequestStatus): Promise<Request> {
  const req = await getRequest(id);
  await req.update({ status });
  return req;
}

async function remove(id: number): Promise<void> {
  const req = await getRequest(id);
  await req.destroy();
}

async function getRequest(id: number): Promise<Request> {
  const req = await db.Request.findByPk(id);
  if (!req) throw 'Request not found';
  return req;
}