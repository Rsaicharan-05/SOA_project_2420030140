package com.hospital.isolation.controller;

import com.hospital.isolation.dto.AuthRequest;
import com.hospital.isolation.dto.AuthResponse;
import com.hospital.isolation.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.authenticate(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sample-users")
    public ResponseEntity<List<Map<String, String>>> getSampleUsers() {
        return ResponseEntity.ok(List.of(
                Map.of(
                        "username", "engineer",
                        "password", "password123",
                        "role", "ROLE_ENGINEER",
                        "description", "Authorized Maintenance Engineer - can create isolation requests and authorize repairs"
                ),
                Map.of(
                        "username", "supervisor1",
                        "password", "password123",
                        "role", "ROLE_WARD_SUPERVISOR",
                        "description", "Ward Supervisor - can submit room acknowledgements"
                ),
                Map.of(
                        "username", "supervisor2",
                        "password", "password123",
                        "role", "ROLE_WARD_SUPERVISOR",
                        "description", "Ward Supervisor (Secondary) - can submit room acknowledgements"
                )
        ));
    }
}
