package com.hospital.isolation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.isolation.dto.AuthRequest;
import com.hospital.isolation.dto.CreateIsolationRequestDto;
import com.hospital.isolation.dto.RoomAcknowledgementRequestDto;
import com.hospital.isolation.model.UtilityValve;
import com.hospital.isolation.repository.UtilityValveRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class IsolationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UtilityValveRepository valveRepository;

    private String engineerToken;
    private String supervisorToken;

    @BeforeEach
    void setUp() throws Exception {
        // 1. Authenticate as Engineer
        AuthRequest engineerLogin = new AuthRequest("engineer", "password123");
        MvcResult engResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(engineerLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode engJson = objectMapper.readTree(engResult.getResponse().getContentAsString());
        engineerToken = "Bearer " + engJson.get("token").asText();

        // 2. Authenticate as Ward Supervisor
        AuthRequest supervisorLogin = new AuthRequest("supervisor1", "password123");
        MvcResult supResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(supervisorLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode supJson = objectMapper.readTree(supResult.getResponse().getContentAsString());
        supervisorToken = "Bearer " + supJson.get("token").asText();
    }

    @Test
    @DisplayName("Security: Unauthenticated requests to protected endpoints return 401 Unauthorized")
    void testUnauthenticatedRequests_returnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/valves"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/isolation-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Security: Ward supervisor cannot create isolation request (returns 403 Forbidden)")
    void testSupervisorCannotCreateIsolationRequest() throws Exception {
        CreateIsolationRequestDto dto = new CreateIsolationRequestDto(1L, "Unauthorized attempt");

        mockMvc.perform(post("/api/isolation-requests")
                        .header("Authorization", supervisorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Ward supervisor cannot authorize repair (returns 403 Forbidden)")
    void testSupervisorCannotAuthorizeRepair() throws Exception {
        mockMvc.perform(post("/api/isolation-requests/1/authorize")
                        .header("Authorization", supervisorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("End-to-End Workflow: Create request -> Prevent with missing room -> Acknowledge all -> Authorize successfully")
    void testCompleteIsolationWorkflow() throws Exception {
        // Find VALVE-O2-EAST
        UtilityValve valve = valveRepository.findByValveCode("VALVE-O2-EAST")
                .orElseThrow(() -> new IllegalStateException("Sample valve not found"));

        List<Long> affectedRoomIds = valve.getAffectedRooms().stream()
                .map(r -> r.getId())
                .sorted()
                .toList();
        assertThat(affectedRoomIds).hasSize(3);

        Long room1 = affectedRoomIds.get(0);
        Long room2 = affectedRoomIds.get(1);
        Long room3 = affectedRoomIds.get(2);

        // --- STEP 1: Engineer creates isolation request for VALVE-O2-EAST ---
        CreateIsolationRequestDto createDto = new CreateIsolationRequestDto(
                valve.getId(),
                "Critical repair of high-pressure oxygen regulator"
        );

        MvcResult createResult = mockMvc.perform(post("/api/isolation-requests")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING_ACKNOWLEDGEMENTS"))
                .andExpect(jsonPath("$.valveCode").value("VALVE-O2-EAST"))
                .andExpect(jsonPath("$.totalRoomsCount").value(3))
                .andExpect(jsonPath("$.acknowledgedRoomsCount").value(0))
                .andExpect(jsonPath("$.pendingRoomsCount").value(3))
                .andReturn();

        JsonNode createdJson = objectMapper.readTree(createResult.getResponse().getContentAsString());
        long requestId = createdJson.get("id").asLong();

        // --- STEP 2: Engineer attempts authorization prematurely (0/3 acknowledged) ---
        // Must be blocked with 409 CONFLICT and return 3 pending rooms
        mockMvc.perform(post("/api/isolation-requests/" + requestId + "/authorize")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("AUTHORIZATION_PREVENTED_PENDING_ACKNOWLEDGEMENTS"))
                .andExpect(jsonPath("$.pendingRoomsCount").value(3))
                .andExpect(jsonPath("$.pendingRooms").isArray());

        // --- STEP 3: Ward Supervisor acknowledges Room 1 ---
        RoomAcknowledgementRequestDto ackDto1 = new RoomAcknowledgementRequestDto(room1, "Patients safely transferred");
        mockMvc.perform(post("/api/isolation-requests/" + requestId + "/acknowledgements")
                        .header("Authorization", supervisorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ackDto1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acknowledgedRoomsCount").value(1))
                .andExpect(jsonPath("$.pendingRoomsCount").value(2));

        // --- STEP 4: Ward Supervisor acknowledges Room 2 ---
        RoomAcknowledgementRequestDto ackDto2 = new RoomAcknowledgementRequestDto(room2, "Ventilator switched to portable O2 cylinder");
        mockMvc.perform(post("/api/isolation-requests/" + requestId + "/acknowledgements")
                        .header("Authorization", supervisorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ackDto2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acknowledgedRoomsCount").value(2))
                .andExpect(jsonPath("$.pendingRoomsCount").value(1));

        // --- STEP 5 [CRITICAL BUSINESS RULE]: Engineer attempts authorization when ONE room is still pending ---
        // Must prevent authorization and specifically identify the remaining pending room (room3)
        MvcResult missingAckResult = mockMvc.perform(post("/api/isolation-requests/" + requestId + "/authorize")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("AUTHORIZATION_PREVENTED_PENDING_ACKNOWLEDGEMENTS"))
                .andExpect(jsonPath("$.totalRooms").value(3))
                .andExpect(jsonPath("$.acknowledgedRooms").value(2))
                .andExpect(jsonPath("$.pendingRoomsCount").value(1))
                .andExpect(jsonPath("$.pendingRooms[0].id").value(room3))
                .andReturn();

        JsonNode missingAckJson = objectMapper.readTree(missingAckResult.getResponse().getContentAsString());
        assertThat(missingAckJson.get("pendingRooms").get(0).get("id").asLong()).isEqualTo(room3);

        // --- STEP 6: Ward Supervisor acknowledges the final room (Room 3) ---
        RoomAcknowledgementRequestDto ackDto3 = new RoomAcknowledgementRequestDto(room3, "All clear in Recovery bay");
        mockMvc.perform(post("/api/isolation-requests/" + requestId + "/acknowledgements")
                        .header("Authorization", supervisorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ackDto3)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acknowledgedRoomsCount").value(3))
                .andExpect(jsonPath("$.pendingRoomsCount").value(0));

        // --- STEP 7: Engineer authorizes repair successfully now that ALL rooms acknowledged ---
        mockMvc.perform(post("/api/isolation-requests/" + requestId + "/authorize")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\": \"All acknowledgements verified. Commencing repair.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AUTHORIZED"))
                .andExpect(jsonPath("$.authorizedBy").value("engineer"))
                .andExpect(jsonPath("$.authorizedAt").isNotEmpty())
                .andExpect(jsonPath("$.acknowledgedRoomsCount").value(3))
                .andExpect(jsonPath("$.pendingRoomsCount").value(0));
    }
}
