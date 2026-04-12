import { db } from '../_helpers/db';
import { Employee, EmployeeCreationAttributes } from './employee.model';

export const employeesService = { getAll, getById, create, update, remove };

async function getAll(): Promise<Employee[]> {
  return db.Employee.findAll({
    include: [
      { association: 'user',       attributes: ['id', 'firstName', 'lastName', 'email'] },
      { association: 'department', attributes: ['id', 'name'] },
    ],
    order: [['employeeId', 'ASC']],
  });
}

async function getById(id: number): Promise<Employee> {
  return getEmployee(id);
}

async function create(params: EmployeeCreationAttributes): Promise<Employee> {
  const dupId = await db.Employee.findOne({ where: { employeeId: params.employeeId } });
  if (dupId) throw `Employee ID "${params.employeeId}" already exists`;

  const user = await db.User.findByPk(params.userId);
  if (!user) throw 'User not found';

  const dept = await db.Department.findByPk(params.departmentId);
  if (!dept) throw 'Department not found';

  return db.Employee.create(params);
}

async function update(id: number, params: Partial<EmployeeCreationAttributes>): Promise<Employee> {
  const emp = await getEmployee(id);

  if (params.employeeId && params.employeeId !== emp.employeeId) {
    const dup = await db.Employee.findOne({ where: { employeeId: params.employeeId } });
    if (dup) throw `Employee ID "${params.employeeId}" already exists`;
  }
  if (params.userId) {
    const user = await db.User.findByPk(params.userId);
    if (!user) throw 'User not found';
  }
  if (params.departmentId) {
    const dept = await db.Department.findByPk(params.departmentId);
    if (!dept) throw 'Department not found';
  }

  await emp.update(params);
  return emp;
}

async function remove(id: number): Promise<void> {
  const emp = await getEmployee(id);
  await emp.destroy();
}

async function getEmployee(id: number): Promise<Employee> {
  const emp = await db.Employee.findByPk(id, {
    include: [
      { association: 'user',       attributes: ['id', 'firstName', 'lastName', 'email'] },
      { association: 'department', attributes: ['id', 'name'] },
    ],
  });
  if (!emp) throw 'Employee not found';
  return emp;
}