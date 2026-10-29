package com.hospital.isolation.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/eureka")
public class EurekaDiscoveryController {

    private final long startTime = System.currentTimeMillis();

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getEurekaStatus() {
        long uptimeSeconds = (System.currentTimeMillis() - startTime) / 1000;
        long hours = uptimeSeconds / 3600;
        long minutes = (uptimeSeconds % 3600) / 60;
        long seconds = uptimeSeconds % 60;
        String formattedUptime = String.format("%02d:%02d:%02d", hours, minutes, seconds);

        long totalMem = Runtime.getRuntime().totalMemory() / (1024 * 1024);
        long freeMem = Runtime.getRuntime().freeMemory() / (1024 * 1024);
        long usedMem = totalMem - freeMem;

        Map<String, Object> systemStatus = Map.of(
                "environment", "production-hospital-cloud",
                "dataCenter", "St. Jude Hospital Healthcare Cloud (Zone East-1)",
                "currentTime", LocalDateTime.now().toString(),
                "uptime", formattedUptime,
                "jvmMemoryUsed", usedMem + " MB / " + totalMem + " MB",
                "availableProcessors", Runtime.getRuntime().availableProcessors(),
                "leaseExpirationEnabled", true,
                "renewsLastMin", 18,
                "renewsThreshold", 15
        );

        List<Map<String, Object>> registeredInstances = List.of(
                Map.of(
                        "application", "API-GATEWAY",
                        "instanceId", "api-gateway:8080",
                        "hostName", "127.0.0.1",
                        "port", 8080,
                        "status", "UP",
                        "zone", "zone-east-1",
                        "healthCheckUrl", "http://localhost:8080/actuator/health",
                        "serviceRole", "JWT Authentication, CORS, Rate Limiting & Dynamic Request Routing",
                        "database", "In-Memory Gateway Cache"
                ),
                Map.of(
                        "application", "UTILITY-TOPOLOGY-SERVICE",
                        "instanceId", "utility-topology-service:8081",
                        "hostName", "127.0.0.1",
                        "port", 8081,
                        "status", "UP",
                        "zone", "zone-east-1",
                        "healthCheckUrl", "http://localhost:8081/actuator/health",
                        "serviceRole", "Manages valve-room dependencies and utility line mappings",
                        "database", "Topology DB (MySQL)"
                ),
                Map.of(
                        "application", "ISOLATION-REQUEST-SERVICE",
                        "instanceId", "isolation-request-service:8082",
                        "hostName", "127.0.0.1",
                        "port", 8082,
                        "status", "UP",
                        "zone", "zone-east-1",
                        "healthCheckUrl", "http://localhost:8082/actuator/health",
                        "serviceRole", "Manages isolation requests, safety guard & publishes IsolationAuthorized Kafka event",
                        "database", "Isolation Request DB (MySQL)"
                ),
                Map.of(
                        "application", "ROOM-ACKNOWLEDGEMENT-SERVICE",
                        "instanceId", "room-acknowledgement-service:8083",
                        "hostName", "127.0.0.1",
                        "port", 8083,
                        "status", "UP",
                        "zone", "zone-east-1",
                        "healthCheckUrl", "http://localhost:8083/actuator/health",
                        "serviceRole", "Handles Designated Nursing Officer (DNO) clinical room sign-offs",
                        "database", "Acknowledgement DB (MySQL)"
                ),
                Map.of(
                        "application", "REPAIR-WORKFLOW-SERVICE",
                        "instanceId", "repair-workflow-service:8084",
                        "hostName", "127.0.0.1",
                        "port", 8084,
                        "status", "UP",
                        "zone", "zone-east-1",
                        "healthCheckUrl", "http://localhost:8084/actuator/health",
                        "serviceRole", "Consumes Kafka events from soa.s02.t16.events and maintains maintenance workflow history",
                        "database", "Workflow DB (MySQL)"
                )
        );

        Map<String, Object> kafkaInfo = Map.of(
                "clusterBootstrap", "localhost:9092",
                "eventTopic", "soa.s02.t16.events",
                "eventType", "IsolationAuthorized",
                "publisherService", "ISOLATION-REQUEST-SERVICE",
                "consumerService", "REPAIR-WORKFLOW-SERVICE",
                "status", "ACTIVE_CONNECTED"
        );

        return ResponseEntity.ok(Map.of(
                "registry", "Spring Cloud Netflix Eureka Discovery Server",
                "version", "2023.0.x / Spring Boot 3.3.5",
                "systemStatus", systemStatus,
                "registeredServicesCount", registeredInstances.size(),
                "registeredServices", registeredInstances,
                "kafkaEventBus", kafkaInfo
        ));
    }
}
