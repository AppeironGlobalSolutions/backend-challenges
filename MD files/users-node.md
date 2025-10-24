# Challenge
---------

Implement a Node.js server that provides a RESTful API for managing a list of users. The server should store the users in a MySQL database and should validate the request data. The API should support the following operations:

-   `GET /users`: Retrieve a list of all users. The list should be returned in JSON format.
-   `POST /users`: Create a new user. The request body should contain the user details in JSON format. The user should have the following fields:
    -   `name`: The name of the user (required).
    -   `email`: The email address of the user (required, must be a valid email format).
    -   `password`: The password for the user (required, must be at least 8 characters long).
-   `GET /users/:id`: Retrieve a single user by ID. The user should be returned in JSON format.
-   `PUT /users/:id`: Update a single user by ID. The request body should contain the updated user details in JSON format.
-   `DELETE /users/:id`: Delete a single user by ID.

## Requirements
------------

-   The server should listen on port 3000.
-   The API should support the above operations using the appropriate HTTP methods (e.g. `GET`, `POST`, `PUT`, `DELETE`).
-   The API should validate the request data and return appropriate error messages if the data is invalid. For example, if a `POST` request to create a new user is missing the required `name` field, the API should return a 400 Bad Request response.
-   The API should use MySQL to store and retrieve the users. You may use the MySQL driver for Node.js or an ORM (Object-Relational Mapper) like Sequelize.
-   The API should hash the user's password before storing it in the database using a secure hashing function like bcrypt.

## Bonus
-----

-   Add authentication to the API using JSON Web Tokens (JWTs). Require a valid JWT to access any of the API endpoints.
-   Implement filtering, pagination, and sorting for the `GET /users` endpoint. Allow the client to specify query parameters to filter the users by email address, to paginate through the results, and to sort the results by a specific field.

## Additional Notes
----------------

-   The code should be organized into appropriate files and directories (e.g. routes in a `routes` directory, models in a `models` directory, etc.).
-   The code should follow best practices for writing scalable and maintainable Node.js applications.
-   You may use any npm packages you like to complete the challenge.
-   You should implement error handling for the MySQL operations. For example, if a user is not found when attempting to retrieve or delete it, the API should return a 404 Not Found response.
-   You do not need to implement any kind of user registration or login functionality for this challenge. You may assume that the JWT will be provided by the client.
