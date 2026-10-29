# 📡 REST API Documentation

The **Hospital Maintenance Isolation System** exposes standard RESTful endpoints secured via stateless JSON Web Tokens (JWT).

- **Base URL:** `http://localhost:8080`
- **Authentication Scheme:** `Bearer <JWT_TOKEN>`

---

## 📑 Summary of Endpoints

| Category | Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT token. |
| **Authentication** | `GET` | `/api/auth/sample-users` | Public | Returns pre-seeded test accounts. |
| **Service Discovery** | `GET` | `/api/eureka/status` | Public | Returns Netflix Eureka service registry and Kafka bus state. |
| **Topology** | `GET` | `/api/valves` | Authenticated | Lists all utility valves and affected hospital rooms. |
| **Topology** | `GET` | `/api/valves/{id}/rooms` | Authenticated | Returns affected clinical rooms for a specific valve. |
| **Isolation Workflow** | `POST` | `/api/isolation-requests` | `ROLE_ENGINEER` | Initiates an isolation request for a valve. |
| **Isolation Workflow** | `GET` | `/api/isolation-requests/{id}` | Authenticated | Retrieves isolation request details and room sign-off status. |
| **Isolation Workflow** | `POST` | `/api/isolation-requests/{id}/acknowledgements` | `ROLE_WARD_SUPERVISOR` | Records a clinical safety acknowledgement for a room. |
| **Isolation Workflow** | `POST` | `/api/isolation-requests/{id}/authorize` | `ROLE_ENGINEER` | Evaluates safety guard and authorizes repair start. |

---

## 1. Authentication APIs

### 1.1 Login

- **Endpoint:** `POST /api/auth/login`
- **Headers:** `Content-Type: application/json`

#### Request Payload:
```json
{
  "username": "engineer",
  "password": "password123"
}
```

#### Successful Response (`200 OK`):
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlbmdpbmVlciIsImlhdCI6MTc...",
  "type": "Bearer",
  "username": "engineer",
  "fullName": "Chief Maintenance Engineer",
  "role": "ROLE_ENGINEER"
}
```

#### Unauthorized Response (`401 Unauthorized`):
```json
{
  "timestamp": "2026-10-27T10:15:30",
  "status": 401,
  "error": "UNAUTHORIZED",
  "message": "Invalid username or password"
}
```

---

## 2. Service Discovery & Architecture Status

### 2.1 Eureka Registry Status

- **Endpoint:** `GET /api/eureka/status`
- **Access:** Public

#### Response (`200 OK`):
```json
{
  "registry": "Spring Cloud Netflix Eureka Discovery Server",
  "version": "2023.0.x / Spring Boot 3.3.5",
  "registeredServicesCount": 5,
  "systemStatus": {
    "environment": "production-hospital-cloud",
    "dataCenter": "St. Jude Hospital Healthcare Cloud (Zone East-1)",
    "uptime": "02:14:35",
    "jvmMemoryUsed": "64 MB / 300 MB",
    "leaseExpirationEnabled": true
  },
  "registeredServices": [
    {
      "application": "API-GATEWAY",
      "instanceId": "api-gateway:8080",
      "hostName": "127.0.0.1",
      "port": 8080,
      "status": "UP",
      "serviceRole": "JWT Authentication, CORS, Rate Limiting & Dynamic Request Routing"
    },
    {
      "application": "UTILITY-TOPOLOGY-SERVICE",
      "instanceId": "utility-topology-service:8081",
      "port": 8081,
      "status": "UP",
      "serviceRole": "Manages valve-room dependencies and utility line mappings"
    },
    {
      "application": "ISOLATION-REQUEST-SERVICE",
      "instanceId": "isolation-request-service:8082",
      "port": 8082,
      "status": "UP",
      "serviceRole": "Manages isolation requests, safety guard & publishes IsolationAuthorized Kafka event"
    },
    {
      "application": "ROOM-ACKNOWLEDGEMENT-SERVICE",
      "instanceId": "room-acknowledgement-service:8083",
      "port": 8083,
      "status": "UP",
      "serviceRole": "Handles Designated Nursing Officer (DNO) clinical room sign-offs"
    },
    {
      "application": "REPAIR-WORKFLOW-SERVICE",
      "instanceId": "repair-workflow-service:8084",
      "port": 8084,
      "status": "UP",
      "serviceRole": "Consumes Kafka events from soa.s02.t16.events and maintains maintenance workflow history"
    }
  ],
  "kafkaEventBus": {
    "status": "ACTIVE_CONNECTED",
    "eventTopic": "soa.s02.t16.events",
    "clusterBootstrap": "localhost:9092",
    "eventType": "IsolationAuthorized"
  }
}
```

---

## 3. Utility Topology APIs

### 3.1 List All Utility Valves & Connected Rooms

- **Endpoint:** `GET /api/valves`
- **Headers:** `Authorization: Bearer <TOKEN>`

#### Response (`200 OK`):
```json
[
  {
    "id": 1,
    "valveCode": "VALVE-O2-EAST",
    "utilityType": "MEDICAL_OXYGEN",
    "location": "Building A - Floor 2 - Service Shaft East",
    "description": "Primary oxygen supply isolation valve for ICU & Recovery",
    "affectedRoomsCount": 3,
    "affectedRooms": [
      {
        "id": 1,
        "roomNumber": "Room 101",
        "wardName": "Intensive Care Unit (ICU)",
        "description": "ICU Isolation Bed 1"
      },
      {
        "id": 2,
        "roomNumber": "Room 102",
        "wardName": "Intensive Care Unit (ICU)",
        "description": "ICU Critical Care Bed 2"
      },
      {
        "id": 3,
        "roomNumber": "Room 103",
        "wardName": "Post-Anesthesia Care Unit (PACU)",
        "description": "Step-down Recovery Bay 3"
      }
    ]
  }
]
```

---

## 4. Isolation & Safety Workflow APIs

### 4.1 Create Isolation Request

- **Endpoint:** `POST /api/isolation-requests`
- **Role Required:** `ROLE_ENGINEER`
- **Headers:** 
  - `Authorization: Bearer <ENGINEER_TOKEN>`
  - `Content-Type: application/json`

#### Request Payload:
```json
{
  "valveId": 1,
  "reason": "Scheduled replacement of medical vacuum line regulator valve"
}
```

#### Response (`201 Created`):
```json
{
  "id": 1,
  "requestNumber": "ISO-0001",
  "status": "PENDING_ACKNOWLEDGEMENTS",
  "valveCode": "VALVE-O2-EAST",
  "utilityType": "MEDICAL_OXYGEN",
  "valveLocation": "Building A - Floor 2 - Service Shaft East",
  "reason": "Scheduled replacement of medical vacuum line regulator valve",
  "requestedBy": "engineer",
  "requestedAt": "2026-10-27T11:01:03.065",
  "totalRooms": 3,
  "acknowledgedRoomsCount": 0,
  "allAcknowledged": false,
  "roomAcknowledgements": [
    {
      "roomId": 1,
      "roomNumber": "Room 101",
      "wardName": "Intensive Care Unit (ICU)",
      "acknowledged": false,
      "acknowledgedBy": null,
      "acknowledgedAt": null,
      "notes": null
    }
  ]
}
```

---

### 4.2 Submit Clinical Room Acknowledgement

- **Endpoint:** `POST /api/isolation-requests/{id}/acknowledgements`
- **Role Required:** `ROLE_WARD_SUPERVISOR`
- **Headers:** 
  - `Authorization: Bearer <SUPERVISOR_TOKEN>`
  - `Content-Type: application/json`

#### Request Payload:
```json
{
  "roomId": 1,
  "notes": "Patient transferred to ICU Bay B; portable cylinder verified"
}
```

#### Response (`200 OK`):
```json
{
  "id": 1,
  "roomId": 1,
  "roomNumber": "Room 101",
  "wardName": "Intensive Care Unit (ICU)",
  "acknowledged": true,
  "acknowledgedBy": "supervisor1",
  "acknowledgedAt": "2026-10-27T11:05:12.441",
  "notes": "Patient transferred to ICU Bay B; portable cylinder verified"
}
```

---

### 4.3 Authorize Repair (Zero-Trust Safety Guard)

- **Endpoint:** `POST /api/isolation-requests/{id}/authorize`
- **Role Required:** `ROLE_ENGINEER`
- **Headers:** 
  - `Authorization: Bearer <ENGINEER_TOKEN>`
  - `Content-Type: application/json`

#### Request Payload:
```json
{
  "notes": "Authorization verified with clinical heads; physical isolation approved."
}
```

#### Case A: Rooms Still Pending (`409 Conflict - BLOCKED`):
```json
{
  "timestamp": "2026-10-27T11:06:01",
  "status": 409,
  "error": "CONFLICT",
  "message": "Cannot authorize repair: 2 affected room(s) have not acknowledged isolation.",
  "pendingRooms": [
    {
      "roomId": 2,
      "roomNumber": "Room 102",
      "wardName": "Intensive Care Unit (ICU)"
    },
    {
      "roomId": 3,
      "roomNumber": "Room 103",
      "wardName": "Post-Anesthesia Care Unit (PACU)"
    }
  ]
}
```

#### Case B: 100% Rooms Acknowledged (`200 OK - AUTHORIZED`):
```json
{
  "id": 1,
  "requestNumber": "ISO-0001",
  "status": "AUTHORIZED",
  "authorizedBy": "engineer",
  "authorizedAt": "2026-10-27T11:08:22",
  "allAcknowledged": true,
  "message": "Isolation authorized successfully. Physical repair work order unlocked."
}
```
