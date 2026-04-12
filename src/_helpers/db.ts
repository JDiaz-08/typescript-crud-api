import config from '../../config.json';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';

export interface Database {
  User:       any;
  Department: any;
  Employee:   any;
  Request:    any;
}

export const db: Database = {} as Database;

export async function initialize(): Promise<void> {
  const { host, port, user, password, database } = config.database;

  const connection = await mysql.createConnection({ host, port, user, password });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();

  const sequelize = new Sequelize(database, user, password, {
    dialect: 'mysql',
    logging: false,
  });

  const { default: userModel }       = await import('../users/user.model');
  const { default: deptModel }       = await import('../departments/department.model');
  const { default: employeeModel }   = await import('../employees/employee.model');
  const { default: requestModel }    = await import('../requests/request.model');

  db.User       = userModel(sequelize);
  db.Department = deptModel(sequelize);
  db.Employee   = employeeModel(sequelize);
  db.Request    = requestModel(sequelize);

  // Associations
  db.Employee.belongsTo(db.User,       { foreignKey: 'userId',       as: 'user' });
  db.Employee.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });
  db.User.hasOne(db.Employee,          { foreignKey: 'userId',       as: 'employee' });
  db.Department.hasMany(db.Employee,   { foreignKey: 'departmentId', as: 'employees' });
  db.Request.belongsTo(db.User,        { foreignKey: 'userId',       as: 'user' });
  db.User.hasMany(db.Request,          { foreignKey: 'userId',       as: 'requests' });

  await sequelize.sync({ alter: true });
  console.log('✅ Database initialized and models synced');

  // Seed default data on first run
  const count = await db.User.count();
  if (count === 0) {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    await db.User.create({
      firstName: 'Admin', lastName: '', title: 'Mr',
      email: 'admin@example.com',
      passwordHash,
      role: 'Admin',
      verified: true,
    });
    await db.Department.bulkCreate([
      { name: 'Engineering', description: 'Software team' },
      { name: 'HR',          description: 'Human Resources' },
    ]);
    console.log('✅ Default admin seeded: admin@example.com / Password123!');
    console.log('✅ Default departments seeded');
  }
}