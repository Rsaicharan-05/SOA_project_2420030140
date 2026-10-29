# 🎓 SOA Viva, Examination & Presentation Guide

This guide is designed for **Service-Oriented Architecture (SOA)** course evaluation, viva examinations, and project demos.

---

## ⏱️ Part 1: The 1-Minute Pitch Script

> **Delivery Cue:** Speak calmly, confidently, and clearly. Takes approximately 50 seconds.

"Good morning/afternoon, Sir/Ma'am.

In critical healthcare facilities, shutting off a central oxygen or vacuum line for maintenance without verifying every operating theatre or ICU can lead to fatal patient outcomes.

To solve this, we designed and developed an **SOA-driven Hospital Maintenance Isolation System** that enforces a **strict Zero-Trust Safety Guard**.

Here is how the system works:
1. When a maintenance engineer requests valve isolation, the **Topology Service** identifies all downstream clinical wards.
2. The system **strictly blocks repair authorization** (`HTTP 409 Conflict`) if even a single room is unverified.
3. Only when **100% of affected rooms** submit clinical acknowledgements does the **Isolation Service** unlock the repair and emit an `IsolationAuthorized` event across an **Apache Kafka event bus**.

Architecturally, our system adheres to core SOA principles: 5 decoupled microservices, dynamic service discovery via **Spring Cloud Netflix Eureka**, perimeter **JWT stateless security** at the API Gateway, and asynchronous event-driven choreography.

Thank you!"

---

## 💡 Part 2: High-Frequency SOA Viva Questions & Answers

### 1. Why SOA / Microservices instead of a Monolith here?
> **Answer:**  
> "In a healthcare environment, **high availability and fault isolation** are critical. If the Maintenance Reporting or Repair Workflow service goes down, the core clinical acknowledgement system for ICU nurses must remain 100% operational. SOA gives us **loose coupling**, **independent deployment**, and allows each service to scale according to its load."

---

### 2. Which core SOA design principles did you implement?
> **Answer:**
> - **Service Autonomy:** Each service encapsulates its own business domain (e.g., Topology vs. Safety Logic vs. Audit Logging).
> - **Loose Coupling:** The isolation service doesn't wait synchronously for the repair workflow; it decouples execution using an Apache Kafka event bus.
> - **Service Discoverability:** Handled dynamically via the **Spring Cloud Netflix Eureka** registry instead of hardcoding IP addresses and ports.
> - **Statelessness:** All HTTP requests authenticate via stateless **JWT bearer tokens** without storing server-side session state.
> - **Standardized Service Contract:** All inter-service and client interactions use RESTful JSON APIs with clear HTTP status codes (`200 OK`, `401 Unauthorized`, `409 Conflict`).

---

### 3. How do the services communicate? Is it Synchronous or Asynchronous?
> **Answer:**
> "We use a **hybrid pattern**:
> - **Synchronous (REST/HTTP):** Used for immediate user queries and the critical safety validation barrier (where the engineer checks if 100% of rooms are verified and gets immediate feedback).
> - **Asynchronous (Event-Driven via Kafka):** Once the repair is authorized, an `IsolationAuthorized` event is published to the `soa.s02.t16.events` topic. Downstream services like the `REPAIR-WORKFLOW-SERVICE` consume this event without blocking the client."

---

### 4. What is the role of Spring Cloud Netflix Eureka in your system?
> **Answer:**
> "Eureka acts as our **Service Registry and Discovery server**. When microservices start up, they register their host, port, and health check URLs with Eureka and send periodic heartbeats. The API Gateway queries Eureka to dynamically route incoming requests to healthy instances without static configuration."

---

### 5. How is Security enforced across the SOA architecture?
> **Answer:**
> "We implemented **stateless JWT-based Role-Based Access Control (RBAC)**:
> - `ROLE_ENGINEER` has permissions to initiate isolation requests and authorize maintenance.
> - `ROLE_WARD_SUPERVISOR` has clinical permissions to acknowledge patient relocations and sign off on room shutdowns.
> The API Gateway / security filter validates the token signature, expiration, and roles before forwarding the request."

---

### 6. How do you maintain data consistency without a distributed 2-Phase Commit (2PC)?
> **Answer:**
> "We follow the **Saga / Eventual Consistency pattern**. The safety gate acts as a prerequisite lock: the isolation request stays in the `PENDING_ACKNOWLEDGEMENTS` state until all localized room events arrive. Only after state transition does the event broker fire the next workflow step."

---

## 🎯 30-Second Live Demonstration Steps

1. Open **`http://localhost:8080/`** in your browser.
2. Select any multi-ward medical line (e.g., **"Medical Oxygen Line — Main Loop"**).
3. Leave one room unverified and click **"Authorize & Start Repair"** &rarr; Point out the red **`HTTP 409 Conflict`** safety guard alert.
4. Tap the remaining room to confirm patient safety &rarr; Click **"Authorize & Start Repair"** &rarr; Point out the green **`HTTP 200 Authorized`** success banner.
5. Click **"Eureka Backend"** at the top right to show the live registry with all 5 microservices and the Kafka topic (`soa.s02.t16.events`).
