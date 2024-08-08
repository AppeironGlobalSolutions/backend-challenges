# Advanced API Challenge: Product Recommendation System

## Objective
Build a RESTful API that recommends products based on given criteria. The API should include a service named `Brain` with a method `generateProductSuggestions` that receives an array of products and returns an array of recommended products. The recommendation engine should be flexible to allow different strategies and include metadata in the response.

## Requirements

### API Endpoint
- **Generate Product Suggestions**: `POST /recommendations`
  - **Request body**:
    ```json
    {
      "products": [
        {
          "id": "1",
          "storeId": "store123",
          "categories": [
            {
              "id": "cat1",
              "name": { "en": "Category 1" },
              "subcategories": ["subcat1"]
            }
          ],
          "description": { "en": "A great product" },
          "images": [{ "id": 1, "src": "image1.jpg", "position": 1 }],
          "name": { "en": "Product 1" },
          "published": true,
          "shooterCount": 10,
          "targetCount": 5,
          "urls": { "canonicalURL": "http://example.com/product1" },
          "variants": [
            {
              "id": "var1",
              "value": "Variant 1",
              "stock": 100,
              "price": 29.99
            }
          ],
          "soldCount": 50,
          "clickCount": 200,
          "creationStoreDate": "2024-01-01T00:00:00Z",
          "updateStoreDate": "2024-02-01T00:00:00Z",
          "createdAt": "2024-01-01T00:00:00Z",
          "updatedAt": "2024-02-01T00:00:00Z"
        }
      ]
    }
    ```
  - **Response body**:
    ```json
    {
      "suggestions": [
        {
          "id": "2",
          "storeId": "store123",
          "categories": [
            {
              "id": "cat2",
              "name": { "en": "Category 2" },
              "subcategories": ["subcat2"]
            }
          ],
          "description": { "en": "Another great product" },
          "images": [{ "id": 2, "src": "image2.jpg", "position": 1 }],
          "name": { "en": "Product 2" },
          "published": true,
          "shooterCount": 8,
          "targetCount": 3,
          "urls": { "canonicalURL": "http://example.com/product2" },
          "variants": [
            {
              "id": "var2",
              "value": "Variant 2",
              "stock": 50,
              "price": 19.99
            }
          ],
          "soldCount": 30,
          "clickCount": 150,
          "creationStoreDate": "2024-01-02T00:00:00Z",
          "updateStoreDate": "2024-02-02T00:00:00Z",
          "createdAt": "2024-01-02T00:00:00Z",
          "updatedAt": "2024-02-02T00:00:00Z"
        }
      ],
      "metadata": {
        "motor": "SimpleEngine",
        "date": "2024-02-15T00:00:00Z",
        "rules": [],
        "boundaries": [],
        "shooterProducts": ["1"],
        "temperature": 0.5
      }
    }
    ```

### Service Layer
- Implement a class `Brain` with the method `generateProductSuggestions`.
  - Method: `generateProductSuggestions(products []Product) ([]Product, Metadata)`

### Core Logic
- **Engines**: Support multiple recommendation engines. For this challenge, implement at least one engine with simple criteria (e.g., products not in the input list, lower price).
- **Metadata**: Include metadata in the result to identify the engine and its parameters used.
- **Pre-Generated Suggestions**: Use a pre-generated tree of suggestions to improve efficiency.

### Product Model (simplified for the challenge)
```go
type Product struct {
  ID          string               `json:"id" bson:"id,omitempty"`
  StoreID     string               `json:"storeId" bson:"storeId"`
  Categories  []CategoryForProduct `json:"categories" bson:"categories"`
  Description Description          `json:"description" bson:"description"`
  Images      []Image              `json:"images" bson:"images"`
  Name        Name                 `json:"name" bson:"name"`
  Published   bool                 `json:"published" bson:"published"`
  ShooterCount int                 `json:"shooterCount" bson:"shooterCount"`
  TargetCount  int                 `json:"targetCount" bson:"targetCount"`
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

### Metadata Model
```go
type Metadata struct {
  Motor           string          `json:"motor"`
  Date            time.Time       `json:"date"`
  Rules           []BrainRule     `json:"rules"`
  Boundaries      []BrainBoundary `json:"boundaries"`
  ShooterProducts []string        `json:"shooterProducts"`
  Temperature     float64         `json:"temperature"`
}

type BrainRule struct {
  // Define rule properties
}

type BrainBoundary struct {
  // Define boundary properties
}
```
### Service Implementation
```go
type Brain struct {
  // Fields necessary for the Brain service
}

func NewBrain() *Brain {
  return &Brain{}
}

func (b *Brain) generateProductSuggestions(products []Product) ([]Product, Metadata) {
  // Simple example engine implementation
  var suggestions []Product
  var metadata Metadata

  // Implement logic to generate suggestions
  for _, product := range products {
    // Example criteria: Suggest products not in the input list and with a lower price
    if product.Price < 20.00 {
      suggestions = append(suggestions, product)
    }
  }

  metadata = Metadata{
    Motor:           "SimpleEngine",
    Date:            time.Now(),
    ShooterProducts: extractProductIDs(products),
    Temperature:     0.5,
  }

  return suggestions, metadata
}

func extractProductIDs(products []Product) []string {
  var ids []string
  for _, product := range products {
    ids = append(ids, product.ID)
  }
  return ids
}
```

### API Handler
```go
func generateProductSuggestionsHandler(w http.ResponseWriter, r *http.Request) {
  var request struct {
    Products []Product `json:"products"`
  }
  err := json.NewDecoder(r.Body).Decode(&request)
  if err != nil {
    http.Error(w, err.Error(), http.StatusBadRequest)
    return
  }

  brain := NewBrain()
  suggestions, metadata := brain.generateProductSuggestions(request.Products)

  response := struct {
    Suggestions []Product `json:"suggestions"`
    Metadata    Metadata  `json:"metadata"`
  }{
    Suggestions: suggestions,
    Metadata:    metadata,
  }

  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode(response)
}

func main() {
  r := mux.NewRouter()
  r.HandleFunc("/recommendations", generateProductSuggestionsHandler).Methods("POST")

  log.Fatal(http.ListenAndServe(":8080", r))
}
```

### Unit Tests
- Develop unit tests for the generateProductSuggestions method and the API handler.
- Ensure different scenarios and conditions are covered.

### Time to Develop
4 to 6 hours

### Keep in Mind
- Efficiency: Ensure the API performs efficiently under load.
- Flexibility: Design the system to easily integrate and switch recommendation engines.
- Code Quality: Follow Go best practices for readability and maintainability.
- Testing: Provide comprehensive tests to cover various use cases and scenarios.
- Scalability: Consider future scalability when designing the system to handle large datasets and high concurrency.



