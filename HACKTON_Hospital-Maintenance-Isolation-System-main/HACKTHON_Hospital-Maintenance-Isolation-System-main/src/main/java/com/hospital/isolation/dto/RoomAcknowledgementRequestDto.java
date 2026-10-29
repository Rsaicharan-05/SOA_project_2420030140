package com.hospital.isolation.dto;

import jakarta.validation.constraints.NotNull;

public class RoomAcknowledgementRequestDto {

    @NotNull(message = "Room ID is required")
    private Long roomId;

    private String notes;

    public RoomAcknowledgementRequestDto() {
    }

    public RoomAcknowledgementRequestDto(Long roomId, String notes) {
        this.roomId = roomId;
        this.notes = notes;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
