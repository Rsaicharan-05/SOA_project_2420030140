package com.hospital.isolation.service;

import com.hospital.isolation.dto.*;
import com.hospital.isolation.exception.InvalidOperationException;
import com.hospital.isolation.exception.PendingAcknowledgementException;
import com.hospital.isolation.exception.ResourceNotFoundException;
import com.hospital.isolation.model.*;
import com.hospital.isolation.repository.IsolationRequestRepository;
import com.hospital.isolation.repository.UtilityValveRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class IsolationService {

    private final IsolationRequestRepository isolationRequestRepository;
    private final UtilityValveRepository valveRepository;

    public IsolationService(IsolationRequestRepository isolationRequestRepository,
                            UtilityValveRepository valveRepository) {
        this.isolationRequestRepository = isolationRequestRepository;
        this.valveRepository = valveRepository;
    }

    /**
     * Requirement 2: Request isolation
     * Allow an authorized engineer to create an isolation request for a selected valve and view its status.
     */
    public IsolationRequestResponseDto createIsolationRequest(CreateIsolationRequestDto dto, String requestedBy) {
        UtilityValve valve = valveRepository.findById(dto.getValveId())
                .orElseThrow(() -> new ResourceNotFoundException("Utility valve not found with ID: " + dto.getValveId()));

        if (valve.getAffectedRooms() == null || valve.getAffectedRooms().isEmpty()) {
            throw new InvalidOperationException("Cannot create isolation request: valve " + valve.getValveCode() + " has no mapped affected rooms.");
        }

        long count = isolationRequestRepository.count();
        String requestNumber = String.format("ISO-%04d", count + 1);

        IsolationRequest request = new IsolationRequest(
                requestNumber,
                valve,
                dto.getReason(),
                requestedBy
        );

        // Pre-populate unacknowledged acknowledgement records for each affected room
        for (Room room : valve.getAffectedRooms()) {
            RoomAcknowledgement ack = new RoomAcknowledgement(request, room);
            request.addAcknowledgement(ack);
        }

        IsolationRequest saved = isolationRequestRepository.save(request);
        return IsolationRequestResponseDto.fromEntity(saved);
    }

    /**
     * View isolation request status and room acknowledgement progress
     */
    @Transactional(readOnly = true)
    public IsolationRequestResponseDto getIsolationRequestById(Long id) {
        IsolationRequest request = isolationRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Isolation request not found with ID: " + id));
        return IsolationRequestResponseDto.fromEntity(request);
    }

    /**
     * List all isolation requests
     */
    @Transactional(readOnly = true)
    public List<IsolationRequestResponseDto> getAllIsolationRequests() {
        return isolationRequestRepository.findAll().stream()
                .map(IsolationRequestResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Requirement 3: Collect room acknowledgements
     * Allow ward supervisors to submit acknowledgements for affected rooms and track responses.
     */
    public IsolationRequestResponseDto acknowledgeRoom(Long isolationRequestId,
                                                       RoomAcknowledgementRequestDto dto,
                                                       String acknowledgedBy) {
        IsolationRequest request = isolationRequestRepository.findById(isolationRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Isolation request not found with ID: " + isolationRequestId));

        if (request.getStatus() != IsolationStatus.PENDING_ACKNOWLEDGEMENTS) {
            throw new InvalidOperationException("Cannot acknowledge rooms: isolation request is in status " + request.getStatus());
        }

        RoomAcknowledgement roomAck = request.getAcknowledgements().stream()
                .filter(ack -> ack.getRoom().getId().equals(dto.getRoomId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Room with ID " + dto.getRoomId() + " is not an affected room for isolation request " + request.getRequestNumber()));

        roomAck.setAcknowledged(true);
        roomAck.setAcknowledgedAt(LocalDateTime.now());
        roomAck.setAcknowledgedBy(acknowledgedBy);
        roomAck.setNotes(dto.getNotes() != null ? dto.getNotes() : "Acknowledged by " + acknowledgedBy);

        IsolationRequest saved = isolationRequestRepository.save(request);
        return IsolationRequestResponseDto.fromEntity(saved);
    }

    /**
     * Requirement 4: Authorize repair start
     * Allow repair authorization only after every affected room has acknowledged isolation.
     * If even one room has not acknowledged, the system must prevent authorization and show the pending room(s).
     */
    public IsolationRequestResponseDto authorizeRepair(Long isolationRequestId,
                                                       AuthorizeRepairRequestDto dto,
                                                       String authorizedBy) {
        IsolationRequest request = isolationRequestRepository.findById(isolationRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Isolation request not found with ID: " + isolationRequestId));

        if (request.getStatus() == IsolationStatus.AUTHORIZED) {
            throw new InvalidOperationException("Isolation request " + request.getRequestNumber() + " is already authorized for repair.");
        }

        if (request.getStatus() != IsolationStatus.PENDING_ACKNOWLEDGEMENTS) {
            throw new InvalidOperationException("Cannot authorize repair: request is in status " + request.getStatus());
        }

        // Strict business rule: Every single affected room must have acknowledged
        if (!request.isFullyAcknowledged()) {
            List<Room> pendingRooms = request.getPendingRooms();
            int totalRooms = request.getAcknowledgements().size();
            int acknowledgedRooms = totalRooms - pendingRooms.size();

            throw new PendingAcknowledgementException(
                    "Cannot authorize repair for request " + request.getRequestNumber() + ": " +
                            pendingRooms.size() + " of " + totalRooms + " room(s) have not yet acknowledged isolation.",
                    request.getId(),
                    request.getRequestNumber(),
                    request.getValve().getValveCode(),
                    totalRooms,
                    acknowledgedRooms,
                    pendingRooms
            );
        }

        // All rooms have acknowledged -> Authorize repair
        request.setStatus(IsolationStatus.AUTHORIZED);
        request.setAuthorizedAt(LocalDateTime.now());
        request.setAuthorizedBy(authorizedBy);

        IsolationRequest saved = isolationRequestRepository.save(request);
        return IsolationRequestResponseDto.fromEntity(saved);
    }
}
