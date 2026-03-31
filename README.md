# TypeScript CRUD API

A simple REST API built with **Node.js**, **TypeScript**, **Express**, and **MySQL (XAMPP)** using Sequelize ORM.

---

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [XAMPP](https://www.apachefriends.org/download.html) (for MySQL)
- [Postman](https://www.postman.com/downloads/) (for testing)

---

## Setup Instructions

### 1. Clone or Download the Project
```bash
cd your-project-folder
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start MySQL via XAMPP
- Open **XAMPP Control Panel**
- Click **Start** next to **MySQL**
- Wait until it turns **green** ✅

### 4. Configure Database

Edit `config.json` in the root folder:
```json
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "typescript_crud_api"
  },
  "jwtSecret": "change-this-in-production-123!"
}
```
> 💡 XAMPP's default MySQL password is empty — leave `"password": ""` as is.

### 5. Run the Server
```bash
npm run start:dev
```

You should see:
```
✅ Database initialized and models synced
✅ Server running on http://localhost:4000
```

---

## Testing with Postman

### Base URL
```
http://localhost:4000
```

---

### Test 1 — Create a User
| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:4000/users` |

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "title": "Mr",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "secret123",
  "confirmPassword": "secret123",
  "role": "User"
}
```

**Expected Response:**
```json
{ "message": "User created" }
```

---

### Test 2 — Get All Users
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:4000/users` |

**Expected Response:**
```json
[
  {
    "id": 1,
    "email": "jane@example.com",
    "title": "Mr",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "User",
    "createdAt": "2026-02-18T10:00:00.000Z",
    "updatedAt": "2026-02-18T10:00:00.000Z"
  }
]
```

---

### Test 3 — Get User by ID
| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:4000/users/1` |

**Expected Response:**
```json
{
  "id": 1,
  "email": "jane@example.com",
  ...
}
```

---

### Test 4 — Update a User
| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `http://localhost:4000/users/1` |

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "firstName": "Janet",
  "password": "newsecret456",
  "confirmPassword": "newsecret456"
}
```

**Expected Response:**
```json
{ "message": "User updated" }
```

---

### Test 5 — Delete a User
| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `http://localhost:4000/users/1` |

**Expected Response:**
```json
{ "message": "User deleted" }
```

---

## Project Structure

```
typescript-crud-api/
├── src/
│   ├── _helpers/
│   │   ├── db.ts           # Database connection & initialization
│   │   └── role.ts         # Role constants (Admin, User)
│   ├── _middleware/
│   │   ├── errorHandler.ts     # Global error handler
│   │   └── validateRequest.ts  # Joi request validator
│   ├── users/
│   │   ├── user.model.ts       # Sequelize User model
│   │   ├── user.service.ts     # Business logic (CRUD)
│   │   └── users.controller.ts # Express routes
│   └── server.ts           # App entry point
├── config.json             # DB config & JWT secret
├── package.json
└── tsconfig.json
```
