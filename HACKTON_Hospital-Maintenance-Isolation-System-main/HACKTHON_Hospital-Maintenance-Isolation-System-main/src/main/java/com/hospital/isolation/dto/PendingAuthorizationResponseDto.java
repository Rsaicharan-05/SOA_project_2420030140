package com.hospital.isolation.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PendingAuthorizationResponseDto {

    private String error = "AUTHORIZATION_PREVENTED_PENDING_ACKNOWLEDGEMENTS";
    private String message;
    private Long isolationRequestId;
    private String requestNumber;
    private String valveCode;
    private int totalRooms;
    private int acknowledgedRooms;
    private int pendingRoomsCount;
    private List<RoomResponseDto> pendingRooms;
    private LocalDateTime timestamp = LocalDateTime.now();

    public PendingAuthorizationResponseDto() {
    }

    public PendingAuthorizationResponseDto(String message, Long isolationRequestId, String requestNumber,
                                          String valveCode, int totalRooms, int acknowledgedRooms,
                                          List<RoomResponseDto> pendingRooms) {
        this.message = message;
        this.isolationRequestId = isolationRequestId;
        this.requestNumber = requestNumber;
        this.valveCode = valveCode;
        this.totalRooms = totalRooms;
        this.acknowledgedRooms = acknowledgedRooms;
        this.pendingRooms = pendingRooms;
        this.pendingRoomsCount = pendingRooms != null ? pendingRooms.size() : 0;
        this.timestamp = LocalDateTime.now();
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getIsolationRequestId() {
        return isolationRequestId;
    }

    public void setIsolationRequestId(Long isolationRequestId) {
        this.isolationRequestId = isolationRequestId;
    }

    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(String requestNumber) {
        this.requestNumber = requestNumber;
    }

    public String getValveCode() {
        return valveCode;
    }

    public void setValveCode(String valveCode) {
        this.valveCode = valveCode;
    }

    public int getTotalRooms() {
        return totalRooms;
    }

    public void setTotalRooms(int totalRooms) {
        this.totalRooms = totalRooms;
    }

    public int getAcknowledgedRooms() {
        return acknowledgedRooms;
    }

    public void setAcknowledgedRooms(int acknowledgedRooms) {
        this.acknowledgedRooms = acknowledgedRooms;
    }

    public int getPendingRoomsCount() {
        return pendingRoomsCount;
    }

    public void setPendingRoomsCount(int pendingRoomsCount) {
        this.pendingRoomsCount = pendingRoomsCount;
    }

    public List<RoomResponseDto> getPendingRooms() {
        return pendingRooms;
    }

    public void setPendingRooms(List<RoomResponseDto> pendingRooms) {
        this.pendingRooms = pendingRooms;
        this.pendingRoomsCount = pendingRooms != null ? pendingRooms.size() : 0;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
