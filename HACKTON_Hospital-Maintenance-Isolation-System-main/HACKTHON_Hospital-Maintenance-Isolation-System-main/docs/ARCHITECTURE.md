# 🏥 System Architecture & SOA Design Document

## 1. Executive Architectural Overview

The **Hospital Maintenance Isolation System** is engineered based on **Service-Oriented Architecture (SOA)** and **Microservice Architecture** patterns. In a healthcare facility, medical utility distribution (such as Medical Oxygen, Vacuum, Compressed Medical Air, and Dialysis Water) directly impacts patient safety in life-critical clinical environments (ICU, NICU, Operating Theatres, and PACU).

The system enforces a **Zero-Trust Safety Guard**: physically isolating a utility line for maintenance is **strictly prevented** (`HTTP 409 Conflict`) unless **100% of affected clinical rooms** have verified and acknowledged patient safety relocations or localized backup deployment.

---

## 2. Service-Oriented Decomposition

```mermaid
graph TB
    subgraph Client Layer
        WebUI[Responsive Clinical UI]
        MobileDNO[Designated Nursing Officer Terminal]
    end

    subgraph Perimeter & Routing Layer
        Gateway[API Gateway :8080<br/>JWT Security & Rate Limiting]
        Eureka[Service Registry :8761<br/>Spring Cloud Netflix Eureka]
    end

    subgraph Domain Microservices
        TopologySvc[UTILITY-TOPOLOGY-SERVICE :8081<br/>Valve-Room Graph & Spatial Dependencies]
        IsolationSvc[ISOLATION-REQUEST-SERVICE :8082<br/>Zero-Trust Safety Guard & Event Publisher]
        AckSvc[ROOM-ACKNOWLEDGEMENT-SERVICE :8083<br/>DNO Clinical Sign-Offs & Room Verification]
        WorkflowSvc[REPAIR-WORKFLOW-SERVICE :8084<br/>Work Orders & Audit History]
    end

    subgraph Event Broker
        Kafka[(Apache Kafka<br/>Topic: soa.s02.t16.events)]
    end

    subgraph Data Stores
        TopologyDB[(Topology DB)]
        IsolationDB[(Isolation DB)]
        AckDB[(Acknowledgement DB)]
        WorkflowDB[(Workflow DB)]
    end

    WebUI --> Gateway
    MobileDNO --> Gateway
    Gateway --> Eureka
    Gateway --> TopologySvc
    Gateway --> IsolationSvc
    Gateway --> AckSvc
    Gateway --> WorkflowSvc

    TopologySvc --- TopologyDB
    IsolationSvc --- IsolationDB
    AckSvc --- AckDB
    WorkflowSvc --- WorkflowDB

    IsolationSvc -.->|Publishes: IsolationAuthorized| Kafka
    Kafka -.->|Consumes Event| WorkflowSvc
```

---

## 3. Microservice Specifications

| Microservice | Default Port | Primary Responsibility | Data Store |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `8080` | Reverse proxy routing, stateless JWT validation, CORS, and centralized security. | Gateway Cache |
| **Service Discovery (Eureka)** | `8761 / embedded` | Dynamic service registration, heartbeat monitoring, and health checking. | In-Memory Registry |
| **Utility Topology Service** | `8081` | Graph dependencies between utility isolation valves and connected clinical rooms. | `TOPOLOGY_DB` |
| **Isolation Request Service** | `8082` | Manages maintenance requests, enforces the Zero-Trust Safety Guard (`409 Conflict`), and publishes authorized events. | `ISOLATION_DB` |
| **Room Acknowledgement Service** | `8083` | Collects clinical sign-offs and patient relocation confirmations from Designated Nursing Officers (DNOs). | `ACKNOWLEDGEMENT_DB` |
| **Repair Workflow Service** | `8084` | Consumes `IsolationAuthorized` events via Apache Kafka to generate repair work orders and track audit history. | `WORKFLOW_DB` |

---

## 4. Zero-Trust Safety Guard Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Engineer as Maintenance Engineer
    actor DNO as Designated Nursing Officer (DNO)
    participant Gateway as API Gateway
    participant IsoService as Isolation Request Service
    participant AckService as Room Acknowledgement Service
    participant Kafka as Apache Kafka Event Bus
    participant Workflow as Repair Workflow Service

    Engineer->>Gateway: POST /api/isolation-requests (Valve ID: VALVE-O2-EAST)
    Gateway->>IsoService: Validate & Create Request
    IsoService-->>Gateway: 201 Created (Status: PENDING_ACKNOWLEDGEMENTS)
    Gateway-->>Engineer: Isolation Request Initialized

    Note over Engineer, IsoService: Safety Guard Active: Unauthorized Attempt
    Engineer->>Gateway: POST /api/isolation-requests/{id}/authorize
    Gateway->>IsoService: Attempt Authorization Check
    IsoService->>AckService: Query Pending Room Acknowledgements
    AckService-->>IsoService: Return 2 Unverified Rooms (ICU Bed 1, Recovery 2)
    IsoService-->>Gateway: 409 Conflict: [PendingAcknowledgementException]
    Gateway-->>Engineer: 409 Conflict: "Repair blocked. 2 rooms pending sign-off."

    Note over DNO, AckService: Clinical Relocation & Sign-Off
    DNO->>Gateway: POST /api/isolation-requests/{id}/acknowledgements (Room 101: Patient relocated)
    Gateway->>AckService: Record Acknowledgement
    DNO->>Gateway: POST /api/isolation-requests/{id}/acknowledgements (Room 102: Backup O2 active)
    Gateway->>AckService: Record Acknowledgement

    Note over Engineer, Workflow: 100% Verification Complete
    Engineer->>Gateway: POST /api/isolation-requests/{id}/authorize
    Gateway->>IsoService: Check Acknowledgement Completion
    IsoService->>AckService: Query Pending Rooms
    AckService-->>IsoService: 0 Rooms Pending (100% Acknowledged)
    IsoService->>IsoService: Transition Status -> AUTHORIZED
    IsoService->>Kafka: Publish "IsolationAuthorized" (Topic: soa.s02.t16.events)
    Kafka->>Workflow: Event Consumed -> Generate Repair Work Order
    IsoService-->>Gateway: 200 OK: "Isolation Authorized. Physical repair unlocked."
    Gateway-->>Engineer: 200 OK: Ready for maintenance
```

---

## 5. Event Contract Specification

When a maintenance isolation achieves 100% room acknowledgement, an asynchronous event is emitted to Apache Kafka:

**Kafka Topic:** `soa.s02.t16.events`  
**Event Key:** `requestNumber` (e.g., `ISO-0002`)

```json
{
  "eventId": "evt_98741352-a3b1",
  "eventType": "IsolationAuthorized",
  "timestamp": "2026-10-27T11:01:40.672Z",
  "payload": {
    "requestId": 2,
    "requestNumber": "ISO-0002",
    "valveCode": "VALVE-O2-EAST",
    "utilityType": "MEDICAL_OXYGEN",
    "authorizedBy": "engineer",
    "totalRoomsAffected": 3,
    "affectedRooms": ["Room 101", "Room 102", "Room 103"],
    "authorizationStatus": "AUTHORIZED"
  }
}
```

---

## 6. Database Entity-Relationship Model

```mermaid
erDiagram
    USERS ||--o{ ISOLATION_REQUESTS : "requests / authorizes"
    USERS ||--o{ ROOM_ACKNOWLEDGEMENTS : "acknowledges"
    UTILITY_VALVES ||--o{ ROOMS : "supplies"
    UTILITY_VALVES ||--o{ ISOLATION_REQUESTS : "isolated_by"
    ISOLATION_REQUESTS ||--o{ ROOM_ACKNOWLEDGEMENTS : "tracks"
    ROOMS ||--o{ ROOM_ACKNOWLEDGEMENTS : "subject_of"

    USERS {
        bigint id PK
        string username UK
        string password
        string full_name
        string role
    }

    UTILITY_VALVES {
        bigint id PK
        string valve_code UK
        string utility_type
        string location
        string description
    }

    ROOMS {
        bigint id PK
        string room_number UK
        string ward_name
        string description
        bigint valve_id FK
    }

    ISOLATION_REQUESTS {
        bigint id PK
        string request_number UK
        string status
        string reason
        timestamp requested_at
        string requested_by
        timestamp authorized_at
        string authorized_by
        bigint valve_id FK
    }

    ROOM_ACKNOWLEDGEMENTS {
        bigint id PK
        boolean acknowledged
        string acknowledged_by
        timestamp acknowledged_at
        string notes
        bigint isolation_request_id FK
        bigint room_id FK
    }
```
