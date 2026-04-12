import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './_middleware/errorHandler';
import { initialize } from './_helpers/db';
import { authController } from './auth/auth.controller';
import usersController from './users/users.controller';
import departmentsController from './departments/departments.controller';
import employeesController from './employees/employees.controller';
import requestsController from './requests/requests.controller';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve the frontend SPA from /public
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/auth',        authController);
app.use('/users',       usersController);
app.use('/departments', departmentsController);
app.use('/employees',   employeesController);
app.use('/requests',    requestsController);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📁 Frontend at http://localhost:${PORT}/`);
      console.log(`🔑 Default admin: admin@example.com / Password123!`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });