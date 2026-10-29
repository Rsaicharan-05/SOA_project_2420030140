package com.hospital.isolation.dto;

import com.hospital.isolation.model.RoomAcknowledgement;
import java.time.LocalDateTime;

public class RoomAcknowledgementResponseDto {

    private Long id;
    private RoomResponseDto room;
    private boolean acknowledged;
    private LocalDateTime acknowledgedAt;
    private String acknowledgedBy;
    private String notes;

    public RoomAcknowledgementResponseDto() {
    }

    public static RoomAcknowledgementResponseDto fromEntity(RoomAcknowledgement ack) {
        if (ack == null) return null;
        RoomAcknowledgementResponseDto dto = new RoomAcknowledgementResponseDto();
        dto.setId(ack.getId());
        dto.setRoom(RoomResponseDto.fromEntity(ack.getRoom()));
        dto.setAcknowledged(ack.isAcknowledged());
        dto.setAcknowledgedAt(ack.getAcknowledgedAt());
        dto.setAcknowledgedBy(ack.getAcknowledgedBy());
        dto.setNotes(ack.getNotes());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RoomResponseDto getRoom() {
        return room;
    }

    public void setRoom(RoomResponseDto room) {
        this.room = room;
    }

    public boolean isAcknowledged() {
        return acknowledged;
    }

    public void setAcknowledged(boolean acknowledged) {
        this.acknowledged = acknowledged;
    }

    public LocalDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public String getAcknowledgedBy() {
        return acknowledgedBy;
    }

    public void setAcknowledgedBy(String acknowledgedBy) {
        this.acknowledgedBy = acknowledgedBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
