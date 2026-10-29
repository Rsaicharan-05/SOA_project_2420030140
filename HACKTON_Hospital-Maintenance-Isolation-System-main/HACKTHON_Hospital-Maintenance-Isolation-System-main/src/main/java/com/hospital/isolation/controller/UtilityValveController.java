package com.hospital.isolation.controller;

import com.hospital.isolation.dto.RoomResponseDto;
import com.hospital.isolation.dto.UtilityValveResponseDto;
import com.hospital.isolation.service.UtilityValveService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/valves")
public class UtilityValveController {

    private final UtilityValveService valveService;

    public UtilityValveController(UtilityValveService valveService) {
        this.valveService = valveService;
    }

    /**
     * Requirement 1: Model valve-room dependencies
     * List all utility valves and their connected rooms.
     */
    @GetMapping
    public ResponseEntity<List<UtilityValveResponseDto>> getAllValves() {
        return ResponseEntity.ok(valveService.getAllValves());
    }

    /**
     * Get a specific valve by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<UtilityValveResponseDto> getValveById(@PathVariable Long id) {
        return ResponseEntity.ok(valveService.getValveById(id));
    }

    /**
     * Requirement 1: Allow the system to identify all rooms affected by a particular valve.
     */
    @GetMapping("/{id}/rooms")
    public ResponseEntity<List<RoomResponseDto>> getAffectedRooms(@PathVariable Long id) {
        return ResponseEntity.ok(valveService.getAffectedRoomsForValve(id));
    }
}
