```markdown
# Backend - Challenge

This project is a RESTful API developed with Node.js, TypeScript, Express, and MongoDB. It implements Domain-Driven Design (DDD) principles and offers authentication, authorization, and CRUD operations for projects and tasks.

## Features

- User authentication and authorization.
- CRUD operations for projects:
  - Create, read, update, and delete projects.
- CRUD operations for tasks:
  - Create, read, update, and delete tasks.
- Filtering of projects and tasks by status.
- Projects and tasks have title, description, due date, and status.

## Requirements

- Node.js
- MongoDB

## Installation

1. Clone the repository:

```sh
git clone https://github.com/NicolasMitre/backend-challenges.git
cd backend-challenges
```

2. Install dependencies:

```sh
npm install
```

3. Configure the database in .env

 ```env
  MONGO_URI = 'mongodb://...'
  ```

4. Compile the project:

```sh
npx tsc
```

5. Start the server:

```sh
node dist/index.js
```

or

```sh
npm run start
```

## Usage

### User Endpoints

- **Register user:**

  ```http
  POST /api/users/register
  ```

  **Body:**

  ```json
  {
    "username": "admin",
    "password": "adminpassword",
    "role": "admin"
  }
  ```

- **Log in:**

  ```http
  POST /api/users/login
  ```

  **Body:**

  ```json
  {
    "username": "admin",
    "password": "adminpassword"
  }
  ```

### Project Endpoints

- **Create project:**

  ```http
  POST /api/projects
  ```

  **Headers:**

  ```http
  Authorization: Bearer <token>
  ```

  **Body:**

  ```json
  {
    "title": "New Project",
    "description": "Project description",
    "dueDate": "2023-12-31",
    "status": "not started"
  }
  ```

- **Get projects:**

  ```http
  GET /api/projects
  ```

  **Headers:**

  ```http
  Authorization: Bearer <token>
  ```

- **Update project:**

  ```http
  PUT /api/projects/:id
  ```

  **Headers:**

  ```http
  Authorization: Bearer <token>
  ```

  **Body:**

  ```json
  {
    "title": "Updated Project",
    "description": "Updated description",
    "dueDate": "2023-12-31",
    "status": "in progress"
  }
  ```

- **Delete project:**

  ```http
  DELETE /api/projects/:id
  ```

  **Headers:**

  ```http
  Authorization: Bearer <token>
  ```

### Task Endpoints

- **Create task:**

  ```http
  POST /api/tasks
  ```

  **Headers:**

  ```http
  Authorization: Bearer <token>
  ```

  **Body:**

  ```json
  {
    "title": "New Task",
    "description": "Task description",
    "dueDate": "2023-12-31",
    "status": "not started",
    "projectId": "<project_id>",
    "assignedTo": "<user_id>"
  }
  ```

- **Get tasks:**

  ```http
  GET /api/tasks
  ```

  **Headers:**

  ```http
  Authorization: Bearer <token>
  ```

- **Update task:**

  ```http
  PUT /api/tasks/:id
  ```

  **Headers:**

  ```http
  Authorization: Bearer <token>
  ```

  **Body:**

  ```json
  {
    "title": "Updated Task",
    "description": "Updated description",
    "dueDate": "2023-12-31",
    "status": "in progress"
  }
  ```

- **Delete task:**

  ```http
  DELETE /api/tasks/:id
  ```

  **Headers:**

  ```http
  Authorization: Bearer <token>
  ```

## Middlewares

### Authentication

The authentication middleware verifies the JWT token in the authorization header.

```typescript
import { authenticateToken } from '../middlewares/authMiddleware';
```

### Authorization

The authorization middleware verifies the user's role.

```typescript
import { authorizeRole } from '../middlewares/authorizationMiddleware';
```

## Contributing

If you wish to contribute to this project, please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/new-feature`).
3. Make your changes and commit them (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
```

This `README.md` file provides an overview of your project, including installation instructions, usage, available endpoints, middlewares, and how to contribute to the project. You can further customize it according to your specific needs.