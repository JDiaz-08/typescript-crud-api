import { db } from '../_helpers/db';
import { Department, DepartmentCreationAttributes } from './department.model';

export const departmentsService = { getAll, getById, create, update, remove };

async function getAll(): Promise<Department[]> {
  return db.Department.findAll({ order: [['name', 'ASC']] });
}

async function getById(id: number): Promise<Department> {
  return getDept(id);
}

async function create(params: DepartmentCreationAttributes): Promise<Department> {
  const existing = await db.Department.findOne({ where: { name: params.name } });
  if (existing) throw `Department "${params.name}" already exists`;
  return db.Department.create(params);
}

async function update(id: number, params: Partial<DepartmentCreationAttributes>): Promise<Department> {
  const dept = await getDept(id);
  if (params.name && params.name !== dept.name) {
    const dup = await db.Department.findOne({ where: { name: params.name } });
    if (dup) throw `Department "${params.name}" already exists`;
  }
  await dept.update(params);
  return dept;
}

async function remove(id: number): Promise<void> {
  const dept = await getDept(id);
  await dept.destroy();
}

async function getDept(id: number): Promise<Department> {
  const dept = await db.Department.findByPk(id);
  if (!dept) throw 'Department not found';
  return dept;
}