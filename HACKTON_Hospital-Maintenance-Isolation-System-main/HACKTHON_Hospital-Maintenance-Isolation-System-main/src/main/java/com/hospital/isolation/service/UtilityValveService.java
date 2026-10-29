package com.hospital.isolation.service;

import com.hospital.isolation.dto.RoomResponseDto;
import com.hospital.isolation.dto.UtilityValveResponseDto;
import com.hospital.isolation.exception.ResourceNotFoundException;
import com.hospital.isolation.model.UtilityValve;
import com.hospital.isolation.repository.UtilityValveRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UtilityValveService {

    private final UtilityValveRepository valveRepository;

    public UtilityValveService(UtilityValveRepository valveRepository) {
        this.valveRepository = valveRepository;
    }

    public List<UtilityValveResponseDto> getAllValves() {
        return valveRepository.findAll().stream()
                .map(UtilityValveResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public UtilityValveResponseDto getValveById(Long id) {
        UtilityValve valve = valveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utility valve not found with ID: " + id));
        return UtilityValveResponseDto.fromEntity(valve);
    }

    public List<RoomResponseDto> getAffectedRoomsForValve(Long valveId) {
        UtilityValve valve = valveRepository.findById(valveId)
                .orElseThrow(() -> new ResourceNotFoundException("Utility valve not found with ID: " + valveId));

        return valve.getAffectedRooms().stream()
                .map(RoomResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
}
