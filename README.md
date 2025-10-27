# Project structure

---

This project is structured following a pseudo DDD aproach, with the following main components:

- **Config**: Minimal configuration of environment variables and validation
- **Shared**: shared models and a single repository (this should be splitted in the future following DDD principles)
- **Domain**: main domain logic, splitted in subdomains (bookings, tables, restaurants, etc)
  - **Models**: domain models
  - **Services**: domain services implementing business logic
  - **Factory**: factories for creating instances of algorithms or other components
  - **Interfaces**: interfaces for algorithms and other components
- **Utils**: utility functions and classes, like logging and error handling
- **DTOs**: data transfer objects for API communication (this should live in a separate layer in the future corresponding to communication layer)
- routes.ts: main API routes (this should live in a separate layer in the future corresponding to communication layer)

This challenge tries to follow Dependency Injection principles, so services receive their dependencies via constructor injection. All services and dependencies are manually instantiated at index.ts for simplicity, but in a real-world application a DI container would be used (for example NestJS modules).

# Business Logic

---

The booking service implements the core business logic for managing reservations, including:

- **Search**: Finding available tables based on user preferences and constraints.
- **Booking**: Creating and managing reservations, including handling conflicts and cancellations.

## Discovery Algorithms

The service supports multiple discovery algorithms for finding available tables. The process is divides in two main steps:

### Table Discovery

1. Identify tables that meet the basic criteria (e.g., size, date, restaurnt, sector, etc)
2. Find candidates from the identified tables using the selected discovery algorithm.
3. If no available tables are found, return an error or fallback option.

### Candidate Selection

1. Select the best candidate from the list (bins algorithm, etc.). In this case, we use the bins algorithm by default:
   1. Generate all combinations of candidates.
   2. Evaluate combinations based on criteria (e.g., total size, number of tables).
   3. If no candidates are found, return an error or fallback option.
   4. In the future we can implement a pondering mechanism to choose the best candidates based on context.
   5. Return all posible candidates
2. Return the selected candidate(s).

## Booking Creation Process

The idempotency and locking mechanism only uses the key for locking. In the future, we can add the payload hash to the idempotency key to ensure that the same request is being processed.

1. Check for idempotency using the provided idempotency key.
2. Lock the selected tables to prevent concurrent bookings.
3. Check for conflicts with existing bookings.
4. Create the booking if no conflicts are found.
5. Release the locks on the tables after the booking process is complete and TTL expires.
