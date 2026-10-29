package com.hospital.isolation.exception;

import com.hospital.isolation.model.Room;
import java.util.List;

public class PendingAcknowledgementException extends RuntimeException {

    private final Long isolationRequestId;
    private final String requestNumber;
    private final String valveCode;
    private final int totalRooms;
    private final int acknowledgedRooms;
    private final List<Room> pendingRooms;

    public PendingAcknowledgementException(String message, Long isolationRequestId, String requestNumber,
                                          String valveCode, int totalRooms, int acknowledgedRooms,
                                          List<Room> pendingRooms) {
        super(message);
        this.isolationRequestId = isolationRequestId;
        this.requestNumber = requestNumber;
        this.valveCode = valveCode;
        this.totalRooms = totalRooms;
        this.acknowledgedRooms = acknowledgedRooms;
        this.pendingRooms = pendingRooms;
    }

    public Long getIsolationRequestId() {
        return isolationRequestId;
    }

    public String getRequestNumber() {
        return requestNumber;
    }

    public String getValveCode() {
        return valveCode;
    }

    public int getTotalRooms() {
        return totalRooms;
    }

    public int getAcknowledgedRooms() {
        return acknowledgedRooms;
    }

    public List<Room> getPendingRooms() {
        return pendingRooms;
    }
}
