package com.hospital.isolation.dto;

import com.hospital.isolation.model.Room;

public class RoomResponseDto {

    private Long id;
    private String roomNumber;
    private String wardName;
    private String description;

    public RoomResponseDto() {
    }

    public RoomResponseDto(Long id, String roomNumber, String wardName, String description) {
        this.id = id;
        this.roomNumber = roomNumber;
        this.wardName = wardName;
        this.description = description;
    }

    public static RoomResponseDto fromEntity(Room room) {
        if (room == null) return null;
        return new RoomResponseDto(room.getId(), room.getRoomNumber(), room.getWardName(), room.getDescription());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getWardName() {
        return wardName;
    }

    public void setWardName(String wardName) {
        this.wardName = wardName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
