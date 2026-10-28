# Go service: step-by-step setup (Docker only)

Goal: a `go/` folder with a small HTTP service that runs in Docker, so Go does not need to be installed on your machine. Run all commands from `microservices/`.

1. **Create the folder and a module.**
   ```bash
   mkdir -p go && cd go
   docker run --rm -v "$PWD":/app -w /app golang:1.24-alpine go mod init example.com/poc/goservice
   ```
   This writes `go.mod` through a throwaway container.

2. **Create `main.go`.** The standard library is enough for now.
   ```go
   package main

   import (
   	"encoding/json"
   	"log"
   	"net/http"
   )

   func main() {
   	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
   		w.Header().Set("Content-Type", "application/json")
   		json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
   	})
   	log.Println("go service listening on 8080")
   	log.Fatal(http.ListenAndServe(":8080", nil))
   }
   ```

3. **Create `Dockerfile`** in `go/`.
   ```dockerfile
   FROM golang:1.24-alpine AS build
   WORKDIR /src
   COPY go.mod ./
   RUN go mod download
   COPY . .
   RUN CGO_ENABLED=0 go build -o /out/goservice .

   FROM alpine:3.20
   COPY --from=build /out/goservice /goservice
   EXPOSE 8080
   ENTRYPOINT ["/goservice"]
   ```
   If you later add dependencies, also copy `go.sum` in the `COPY` line.

4. **Register it in `../docker-compose.yml`**, under `services:`.
   ```yaml
     go:
       build: ./go
       ports:
         - "5003:8080"
   ```

5. **Run and check it.**
   ```bash
   cd ..
   docker compose up --build go
   curl http://localhost:5003/health
   ```
   Expected: `{"status":"healthy"}`.

Note: the final image is Alpine with one static binary, so it stays small.
