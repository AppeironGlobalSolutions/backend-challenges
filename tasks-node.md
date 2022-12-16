# Challenge
---------

Implement a Node.js server that provides a RESTful API for managing a list of tasks. The server should persist the tasks in a MongoDB database. The API should support the following operations:

-   `GET /tasks`: Retrieve a list of all tasks. The list should be returned in JSON format.
-   `POST /tasks`: Create a new task. The request body should contain the task details in JSON format. The task should have the following fields:
    -   `name`: The name of the task (required).
    -   `description`: A description of the task (optional).
    -   `completed`: A boolean indicating whether the task has been completed (default: false).
-   `GET /tasks/:id`: Retrieve a single task by ID. The task should be returned in JSON format.
-   `PUT /tasks/:id`: Update a single task by ID. The request body should contain the updated task details in JSON format.
-   `DELETE /tasks/:id`: Delete a single task by ID.

## Requirements
------------

-   The server should listen on port 3000.
-   The API should support the above operations using the appropriate HTTP methods (e.g. `GET`, `POST`, `PUT`, `DELETE`).
-   The API should validate the request data and return appropriate error messages if the data is invalid. For example, if a `POST` request to create a new task is missing the required `name` field, the API should return a 400 Bad Request response.
-   The API should use MongoDB to store and retrieve the tasks. You may use the MongoDB driver for Node.js or a MongoDB ODM (Object Document Mapper) like Mongoose.
-   Use the Express.js framework to build the server.
-   Use the [Express Validator](https://express-validator.github.io/docs/) middleware to validate the request data.
-   Use [Jest](https://jestjs.io/) and [SuperTest](https://github.com/visionmedia/supertest) to write automated tests for the API.
-   Use [Istanbul](https://istanbul.js.org/) to generate a code coverage report for the tests.
-   Use [ESLint](https://eslint.org/) to lint the code and enforce a consistent style.
-   Use [Prettier](https://prettier.io/) to automatically format the code according to a consistent style.
-   Use [Swagger](https://swagger.io/) or [JSDoc](http://usejsdoc.org/) to document the API.

## Bonus
-----

-   Add authentication to the API using JSON Web Tokens (JWTs). Require a valid JWT to access any of the API endpoints.
-   Implement filtering, pagination, and sorting for the `GET /tasks` endpoint. Allow the client to specify query parameters to filter the tasks by completion status, to paginate through the results, and to sort the results by a specific field.

## Additional Notes
----------------

-   The code should be organized into appropriate files and directories (e.g. routes in a `routes` directory, models in a `models` directory, etc.).
-   The code should follow best practices for writing scalable and maintainable Node.js applications.
-   The tests should cover the main functionality of the API and should be thorough enough to give
