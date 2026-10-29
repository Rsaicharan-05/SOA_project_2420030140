package com.hospital.isolation.service;

import com.hospital.isolation.dto.AuthorizeRepairRequestDto;
import com.hospital.isolation.dto.CreateIsolationRequestDto;
import com.hospital.isolation.dto.IsolationRequestResponseDto;
import com.hospital.isolation.dto.RoomAcknowledgementRequestDto;
import com.hospital.isolation.exception.InvalidOperationException;
import com.hospital.isolation.exception.PendingAcknowledgementException;
import com.hospital.isolation.exception.ResourceNotFoundException;
import com.hospital.isolation.model.*;
import com.hospital.isolation.repository.IsolationRequestRepository;
import com.hospital.isolation.repository.UtilityValveRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IsolationServiceTest {

    @Mock
    private IsolationRequestRepository isolationRequestRepository;

    @Mock
    private UtilityValveRepository valveRepository;

    @InjectMocks
    private IsolationService isolationService;

    private UtilityValve valveO2;
    private Room room101;
    private Room room102;
    private Room room103;

    @BeforeEach
    void setUp() {
        room101 = new Room("Room 101", "ICU", "Bed 1");
        room101.setId(1L);

        room102 = new Room("Room 102", "ICU", "Bed 2");
        room102.setId(2L);

        room103 = new Room("Room 103", "Recovery", "Bay 3");
        room103.setId(3L);

        valveO2 = new UtilityValve("VALVE-O2-EAST", "MEDICAL_OXYGEN", "East Service Shaft", "ICU Oxygen Supply");
        valveO2.setId(10L);
        valveO2.addRoom(room101);
        valveO2.addRoom(room102);
        valveO2.addRoom(room103);
    }

    @Test
    @DisplayName("Requirement 1 & 2: Creating an isolation request initializes all connected rooms as unacknowledged")
    void testCreateIsolationRequest_initializesAllRoomAcknowledgements() {
        CreateIsolationRequestDto dto = new CreateIsolationRequestDto(10L, "Oxygen pipeline joint gasket replacement");

        when(valveRepository.findById(10L)).thenReturn(Optional.of(valveO2));
        when(isolationRequestRepository.count()).thenReturn(0L);
        when(isolationRequestRepository.save(any(IsolationRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IsolationRequestResponseDto response = isolationService.createIsolationRequest(dto, "engineer");

        assertThat(response).isNotNull();
        assertThat(response.getRequestNumber()).isEqualTo("ISO-0001");
        assertThat(response.getValveCode()).isEqualTo("VALVE-O2-EAST");
        assertThat(response.getStatus()).isEqualTo(IsolationStatus.PENDING_ACKNOWLEDGEMENTS);
        assertThat(response.getTotalRoomsCount()).isEqualTo(3);
        assertThat(response.getAcknowledgedRoomsCount()).isEqualTo(0);
        assertThat(response.getPendingRoomsCount()).isEqualTo(3);

        ArgumentCaptor<IsolationRequest> captor = ArgumentCaptor.forClass(IsolationRequest.class);
        verify(isolationRequestRepository).save(captor.capture());
        IsolationRequest saved = captor.getValue();
        assertThat(saved.getAcknowledgements()).hasSize(3);
        assertThat(saved.getAcknowledgements()).allMatch(ack -> !ack.isAcknowledged());
    }

    @Test
    @DisplayName("Requirement 3: Ward supervisor can acknowledge an affected room")
    void testAcknowledgeRoom_updatesAcknowledgementStatus() {
        IsolationRequest request = new IsolationRequest("ISO-0001", valveO2, "Maintenance", "engineer");
        RoomAcknowledgement ack101 = new RoomAcknowledgement(request, room101);
        RoomAcknowledgement ack102 = new RoomAcknowledgement(request, room102);
        request.addAcknowledgement(ack101);
        request.addAcknowledgement(ack102);

        when(isolationRequestRepository.findById(1L)).thenReturn(Optional.of(request));
        when(isolationRequestRepository.save(any(IsolationRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RoomAcknowledgementRequestDto ackDto = new RoomAcknowledgementRequestDto(1L, "Patient moved to temporary unit");
        IsolationRequestResponseDto response = isolationService.acknowledgeRoom(1L, ackDto, "supervisor1");

        assertThat(response.getAcknowledgedRoomsCount()).isEqualTo(1);
        assertThat(response.getPendingRoomsCount()).isEqualTo(1);
        assertThat(ack101.isAcknowledged()).isTrue();
        assertThat(ack101.getAcknowledgedBy()).isEqualTo("supervisor1");
        assertThat(ack101.getNotes()).isEqualTo("Patient moved to temporary unit");
        assertThat(ack102.isAcknowledged()).isFalse();
    }

    @Test
    @DisplayName("Requirement 4 [CRITICAL]: One missing room acknowledgement MUST prevent repair authorization and identify the pending room")
    void testAuthorizeRepair_whenOneRoomAcknowledgementIsMissing_preventsAuthorization() {
        IsolationRequest request = new IsolationRequest("ISO-0001", valveO2, "Leak repair", "engineer");
        request.setId(100L);

        // Room 101 acknowledged
        RoomAcknowledgement ack101 = new RoomAcknowledgement(request, room101);
        ack101.setAcknowledged(true);
        ack101.setAcknowledgedBy("supervisor1");

        // Room 102 acknowledged
        RoomAcknowledgement ack102 = new RoomAcknowledgement(request, room102);
        ack102.setAcknowledged(true);
        ack102.setAcknowledgedBy("supervisor1");

        // Room 103 NOT acknowledged (PENDING)
        RoomAcknowledgement ack103 = new RoomAcknowledgement(request, room103);
        ack103.setAcknowledged(false);

        request.addAcknowledgement(ack101);
        request.addAcknowledgement(ack102);
        request.addAcknowledgement(ack103);

        when(isolationRequestRepository.findById(100L)).thenReturn(Optional.of(request));

        AuthorizeRepairRequestDto dto = new AuthorizeRepairRequestDto("Proceeding with repair");

        // Business rule verification: exception must be thrown with pending room details
        assertThatThrownBy(() -> isolationService.authorizeRepair(100L, dto, "engineer"))
                .isInstanceOf(PendingAcknowledgementException.class)
                .satisfies(ex -> {
                    PendingAcknowledgementException pae = (PendingAcknowledgementException) ex;
                    assertThat(pae.getIsolationRequestId()).isEqualTo(100L);
                    assertThat(pae.getRequestNumber()).isEqualTo("ISO-0001");
                    assertThat(pae.getValveCode()).isEqualTo("VALVE-O2-EAST");
                    assertThat(pae.getTotalRooms()).isEqualTo(3);
                    assertThat(pae.getAcknowledgedRooms()).isEqualTo(2);

                    List<Room> pendingRooms = pae.getPendingRooms();
                    assertThat(pendingRooms).hasSize(1);
                    assertThat(pendingRooms.get(0).getRoomNumber()).isEqualTo("Room 103");
                    assertThat(pendingRooms.get(0).getWardName()).isEqualTo("Recovery");
                });

        // Request status remains PENDING_ACKNOWLEDGEMENTS and was not authorized
        assertThat(request.getStatus()).isEqualTo(IsolationStatus.PENDING_ACKNOWLEDGEMENTS);
        assertThat(request.getAuthorizedAt()).isNull();
        verify(isolationRequestRepository, never()).save(any(IsolationRequest.class));
    }

    @Test
    @DisplayName("Requirement 4: Authorize repair succeeds ONLY when ALL affected rooms have acknowledged")
    void testAuthorizeRepair_whenAllRoomsAcknowledged_authorizesSuccessfully() {
        IsolationRequest request = new IsolationRequest("ISO-0001", valveO2, "Leak repair", "engineer");
        request.setId(100L);

        RoomAcknowledgement ack101 = new RoomAcknowledgement(request, room101);
        ack101.setAcknowledged(true);
        RoomAcknowledgement ack102 = new RoomAcknowledgement(request, room102);
        ack102.setAcknowledged(true);
        RoomAcknowledgement ack103 = new RoomAcknowledgement(request, room103);
        ack103.setAcknowledged(true);

        request.addAcknowledgement(ack101);
        request.addAcknowledgement(ack102);
        request.addAcknowledgement(ack103);

        when(isolationRequestRepository.findById(100L)).thenReturn(Optional.of(request));
        when(isolationRequestRepository.save(any(IsolationRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthorizeRepairRequestDto dto = new AuthorizeRepairRequestDto("All clear, starting work");
        IsolationRequestResponseDto response = isolationService.authorizeRepair(100L, dto, "engineer");

        assertThat(response.getStatus()).isEqualTo(IsolationStatus.AUTHORIZED);
        assertThat(response.getAuthorizedBy()).isEqualTo("engineer");
        assertThat(response.getAuthorizedAt()).isNotNull();
        assertThat(response.getAcknowledgedRoomsCount()).isEqualTo(3);
        assertThat(response.getPendingRoomsCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("Reject acknowledgement attempt for a room not affected by the valve")
    void testAcknowledgeRoom_forUnaffectedRoom_throwsNotFoundException() {
        IsolationRequest request = new IsolationRequest("ISO-0001", valveO2, "Maintenance", "engineer");
        RoomAcknowledgement ack101 = new RoomAcknowledgement(request, room101);
        request.addAcknowledgement(ack101);

        when(isolationRequestRepository.findById(1L)).thenReturn(Optional.of(request));

        // Room 999 is not part of this request
        RoomAcknowledgementRequestDto ackDto = new RoomAcknowledgementRequestDto(999L, "Notes");

        assertThatThrownBy(() -> isolationService.acknowledgeRoom(1L, ackDto, "supervisor1"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Room with ID 999 is not an affected room");
    }

    @Test
    @DisplayName("Prevent authorizing an already authorized isolation request")
    void testAuthorizeRepair_whenAlreadyAuthorized_throwsInvalidOperation() {
        IsolationRequest request = new IsolationRequest("ISO-0001", valveO2, "Maintenance", "engineer");
        request.setStatus(IsolationStatus.AUTHORIZED);

        when(isolationRequestRepository.findById(1L)).thenReturn(Optional.of(request));

        AuthorizeRepairRequestDto dto = new AuthorizeRepairRequestDto("Try again");

        assertThatThrownBy(() -> isolationService.authorizeRepair(1L, dto, "engineer"))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("already authorized");
    }
}
