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

async function create(params: any): Promise<Employee> {
  // Support lookup by email if userId not provided directly
  let userId = params.userId;
  if (!userId && params.userEmail) {
    const user = await db.User.findOne({ where: { email: params.userEmail } });
    if (!user) throw `No account found with email "${params.userEmail}"`;
    userId = user.id;
  }
  if (!userId) throw 'User is required';

  const user = await db.User.findByPk(userId);
  if (!user) throw 'User not found';

  const dept = await db.Department.findByPk(params.departmentId);
  if (!dept) throw 'Department not found';

  const dupId = await db.Employee.findOne({ where: { employeeId: params.employeeId } });
  if (dupId) throw `Employee ID "${params.employeeId}" already exists`;

  // Check user doesn't already have an employee record
  const dupUser = await db.Employee.findOne({ where: { userId } });
  if (dupUser) throw `This user already has an employee record`;

  return db.Employee.create({
    employeeId:   params.employeeId,
    userId,
    departmentId: params.departmentId,
    position:     params.position,
    hireDate:     params.hireDate,
  });
}

async function update(id: number, params: any): Promise<Employee> {
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

  await emp.update({
    employeeId:   params.employeeId   ?? emp.employeeId,
    userId:       params.userId       ?? emp.userId,
    departmentId: params.departmentId ?? emp.departmentId,
    position:     params.position     ?? emp.position,
    hireDate:     params.hireDate     ?? emp.hireDate,
  });
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