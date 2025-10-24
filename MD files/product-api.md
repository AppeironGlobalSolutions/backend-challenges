# Product API Challenge

## Goal
Develop a CRUD API for managing products using Go and the Gin framework, adhering to clean code principles and the hexagonal architecture pattern. Additionally, implement a recommendation algorithm within a service/entity called `Brain`.

## Requirements

### 1. Project Setup
- Use Go modules for dependency management.
- Use the Gin framework for the HTTP server.

### 2. Hexagonal Architecture Layers
- **Domain Layer**: Contains the core business logic and entities.
- **Application Layer**: Contains use cases and service interfaces.
- **Adapters Layer**: Contains the web, persistence, and other adapters.
- **Infrastructure Layer**: Contains implementation details like database connections.

### 3. Product Model
Use the provided `Product` model as the core entity. Ensure all related types (`CategoryForProduct`, `Description`, `Image`, `Name`, `Urls`, `Variant`, etc.) are defined in the domain layer.

### 4. CRUD Operations
- **Create**: Add a new product.
- **Read**: Retrieve a product by ID.
- **Update**: Update an existing product.
- **Delete**: Remove a product by ID.

### 5. API Endpoints
- `POST /products`: Create a new product.
- `GET /products/:id`: Retrieve a product by ID.
- `PUT /products/:id`: Update a product by ID.
- `DELETE /products/:id`: Delete a product by ID.
- `POST /recommendations`: Get product recommendations.

### 6. Persistence
- Use a simple in-memory storage or a database like MongoDB.
- Implement repository interfaces in the domain layer and their corresponding implementations in the infrastructure layer.

### 7. Validation and Error Handling
- Ensure proper validation of input data.
- Handle errors gracefully and return appropriate HTTP status codes.

### 8. Testing
- Write unit tests for the core business logic in the domain layer.
- Write integration tests for the application layer.

### 9. Recommendation Engine Setup
- **Service/Entity Creation**: Develop a service/entity called `Brain`, responsible for generating product suggestions. This service should be designed using clean code principles and should follow the hexagonal architecture approach.
- **Method Implementation**: Implement a method `generateProductSuggestions` within the `Brain` entity. This method will be the core of the recommendation engine, responsible for processing input data and producing output suggestions.

### 10. Method Input and Output
- **Input**: The `generateProductSuggestions` method should accept the following parameters:
  - **Products[]**: An array of `Product` objects.
  - **BrainBoundary[]**: An array of `Boundary` objects that define the constraints for the recommendation engine, such as price limits, category restrictions, recently added products, only products with stock, etc.
  - **BrainRule[]**: An array of `Rule` objects that define specific business rules or logic that the recommendation engine should follow, such as prioritizing certain categories.
  
- **Output**:
  - **Products[]**: An array of recommended `Product` objects, filtered and ranked based on the applied boundaries and rules.
  - **BrainMetadata**: Additional metadata about the recommendation process, such as processing time, number of products considered, and any applied rules or filters.

### 11. Algorithm Details
- **Modular and Abstracted Design**: The recommendation algorithm should be modular, allowing for easy extension or modification of boundaries and rules. The implementation should follow the principles of clean code, ensuring readability, maintainability, and testability.
- **Filtering and Ranking**: The algorithm should first filter the input products based on the `BrainBoundary` constraints, ensuring only eligible products are considered. It should then rank the filtered products according to the `BrainRule` logic, providing the most relevant suggestions at the top.
- **Test Cases**: Develop a comprehensive suite of test cases to validate the functionality of the recommendation engine. These tests should cover various scenarios, including different combinations of boundaries and rules, edge cases, and performance benchmarks.

### 12. Configuration of Boundaries and Rules
- Allow the configuration of boundaries and rules that the recommendation engine should consider.
- Define `BrainBoundary` and `BrainRule` types in the domain layer.

### 13. Testing
- Write unit tests for the recommendation logic within the domain layer.
- Write integration tests to ensure the `generateProductSuggestions` method works correctly with the rest of the application.

### 14. Database Availability
- A JSON database of products is available and should be used as the source for the `Products[]` array. This database contains detailed information on each product.

## Unit Tests
- Develop unit tests for the generateProductSuggestions method and the API handlers.
- Ensure different scenarios and conditions are covered.

## Time to Develop
4 to 6 hours

## Keep in Mind
- Code Quality: Follow Go best practices for readability and maintainability.
- Testing: Provide comprehensive tests to cover various use cases and scenarios.

## Project Structure
```go
project-root/
├── cmd/
│   └── main.go
├── internal/
│   ├── adapters/
│   │   ├── web/
│   │   │   └── handlers/
│   │   ├── persistence/
│   │   │   └── repository/
│   ├── application/
│   │   └── services/
│   ├── domain/
│   │   ├── entities/
│   │   └── repositories/
│   └── infrastructure/
│       └── db/
└── go.mod
└── go.sum
```
## Implementation Guidelines
### Domain Layer
Define the Product entity and related types.

```go
// internal/domain/entities/product.go
package entities

type Product struct {
  ID          string               `json:"id" bson:"id,omitempty"`
  StoreID     string               `json:"storeId" bson:"storeId"`
  Categories  []CategoryForProduct `json:"categories" bson:"categories"`
  Description Description          `json:"description" bson:"description"`
  Images      []Image              `json:"images" bson:"images"`
  Name        Name                 `json:"name" bson:"name"`
  Published   bool                 `json:"published" bson:"published"`
  Urls        Urls                 `json:"urls" bson:"urls"`
  Variants    []Variant            `json:"variants" bson:"variants"`
  SoldCount   int                  `json:"soldCount" bson:"soldCount"`
  ClickCount  int                  `json:"clickCount" bson:"clickCount"`
  CreatedAt   CustomTime           `json:"createdAt" bson:"createdAt"`
  UpdatedAt   CustomTime           `json:"updatedAt" bson:"updatedAt"`
}

type CategoryForProduct struct {
  ID            string       `json:"id" bson:"id"`
  Name          CategoryName `json:"name" bson:"name"`
  Subcategories []string     `json:"subcategories" bson:"subcategories"`
}

type CategoryName struct {
  LocalizedString `bson:",inline"`
}

type Description struct {
  LocalizedString `bson:",inline"`
}

type Image struct {
  ID        int    `json:"id" bson:"id"`
  Src       string `json:"src" bson:"src"`
  Position  int    `json:"position" bson:"position"`
  Alt       Alt    `json:"alt" bson:"alt"`
}

type Name struct {
  LocalizedString `bson:",inline"`
}

type Urls struct {
  CanonicalURL string  `json:"canonicalURL" bson:"canonicalURL"`
  VideoURL     *string `json:"videoURL" bson:"videoURL"`
}

type Variant struct {
  ID               string   `json:"id" bson:"id"`
  Value            string   `json:"value" bson:"value"`
  Stock            int      `json:"stock" bson:"stock"`
  Price            float64  `json:"price" bson:"price"`
}

type LocalizedString struct {
  En *string `json:"en,omitempty" bson:"en,omitempty"`
  Es *string `json:"es,omitempty" bson:"es,omitempty"`
  Pt *string `json:"pt,omitempty" bson:"pt,omitempty"`
}

type Alt struct {
  LocalizedString `bson:",inline"`
}

type CustomTime struct {
  time.Time
}

func (ct *CustomTime) MarshalJSON() ([]byte, error) {
  return []byte(fmt.Sprintf("\"%s\"", ct.Time.UTC().Format("2006-01-02T15:04:05.000Z"))), nil
}
```



