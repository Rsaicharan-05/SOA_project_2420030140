package com.hospital.isolation.controller;

import com.hospital.isolation.dto.*;
import com.hospital.isolation.service.IsolationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/isolation-requests")
public class IsolationRequestController {

    private final IsolationService isolationService;

    public IsolationRequestController(IsolationService isolationService) {
        this.isolationService = isolationService;
    }

    /**
     * Requirement 2: Request isolation
     * Allow an authorized engineer to create an isolation request for a selected valve.
     */
    @PostMapping
    public ResponseEntity<IsolationRequestResponseDto> createIsolationRequest(
            @Valid @RequestBody CreateIsolationRequestDto dto,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "engineer";
        IsolationRequestResponseDto created = isolationService.createIsolationRequest(dto, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Requirement 2: View isolation request status and progress.
     */
    @GetMapping("/{id}")
    public ResponseEntity<IsolationRequestResponseDto> getIsolationRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(isolationService.getIsolationRequestById(id));
    }

    /**
     * View all isolation requests.
     */
    @GetMapping
    public ResponseEntity<List<IsolationRequestResponseDto>> getAllIsolationRequests() {
        return ResponseEntity.ok(isolationService.getAllIsolationRequests());
    }

    /**
     * Requirement 3: Collect room acknowledgements
     * Allow ward supervisors to submit acknowledgements for affected rooms and track responses.
     */
    @PostMapping("/{id}/acknowledgements")
    public ResponseEntity<IsolationRequestResponseDto> acknowledgeRoom(
            @PathVariable Long id,
            @Valid @RequestBody RoomAcknowledgementRequestDto dto,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "wardSupervisor";
        IsolationRequestResponseDto updated = isolationService.acknowledgeRoom(id, dto, username);
        return ResponseEntity.ok(updated);
    }

    /**
     * Requirement 4: Authorize repair start
     * Allow repair authorization only after every affected room has acknowledged isolation.
     * If even one room has not acknowledged, the system must prevent authorization and show the pending room(s).
     */
    @PostMapping("/{id}/authorize")
    public ResponseEntity<IsolationRequestResponseDto> authorizeRepair(
            @PathVariable Long id,
            @RequestBody(required = false) AuthorizeRepairRequestDto dto,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "engineer";
        if (dto == null) {
            dto = new AuthorizeRepairRequestDto();
        }
        IsolationRequestResponseDto authorized = isolationService.authorizeRepair(id, dto, username);
        return ResponseEntity.ok(authorized);
    }
}
