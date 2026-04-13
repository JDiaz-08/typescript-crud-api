import { db } from '../_helpers/db';
import { Request, RequestCreationAttributes, RequestStatus, RequestItem } from './request.model';

export const requestsService = { getAll, getMyRequests, getById, create, updateStatus, remove };

async function getAll(): Promise<Request[]> {
  return db.Request.findAll({
    include: [{ association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['createdAt', 'DESC']],
  });
}

async function getMyRequests(userId: number): Promise<Request[]> {
  return db.Request.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });
}

async function getById(id: number): Promise<Request> {
  return getRequest(id);
}

async function create(params: RequestCreationAttributes, userId: number): Promise<Request> {
  if (!params.items || params.items.length === 0)
    throw 'At least one item is required';

  // Ensure items is a clean array before saving
  const items: RequestItem[] = params.items.map(i => ({
    name: String(i.name).trim(),
    qty:  Number(i.qty),
  }));

  return db.Request.create({
    type:   params.type,
    items,
    userId,
    status: 'Pending',
    date:   new Date().toISOString().split('T')[0],
  });
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