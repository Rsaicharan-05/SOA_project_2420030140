package com.hospital.isolation.dto;

import com.hospital.isolation.model.UtilityValve;
import java.util.List;
import java.util.stream.Collectors;

public class UtilityValveResponseDto {

    private Long id;
    private String valveCode;
    private String utilityType;
    private String location;
    private String description;
    private int affectedRoomsCount;
    private List<RoomResponseDto> affectedRooms;

    public UtilityValveResponseDto() {
    }

    public static UtilityValveResponseDto fromEntity(UtilityValve valve) {
        if (valve == null) return null;
        UtilityValveResponseDto dto = new UtilityValveResponseDto();
        dto.setId(valve.getId());
        dto.setValveCode(valve.getValveCode());
        dto.setUtilityType(valve.getUtilityType());
        dto.setLocation(valve.getLocation());
        dto.setDescription(valve.getDescription());
        if (valve.getAffectedRooms() != null) {
            dto.setAffectedRoomsCount(valve.getAffectedRooms().size());
            dto.setAffectedRooms(valve.getAffectedRooms().stream()
                    .map(RoomResponseDto::fromEntity)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getValveCode() {
        return valveCode;
    }

    public void setValveCode(String valveCode) {
        this.valveCode = valveCode;
    }

    public String getUtilityType() {
        return utilityType;
    }

    public void setUtilityType(String utilityType) {
        this.utilityType = utilityType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getAffectedRoomsCount() {
        return affectedRoomsCount;
    }

    public void setAffectedRoomsCount(int affectedRoomsCount) {
        this.affectedRoomsCount = affectedRoomsCount;
    }

    public List<RoomResponseDto> getAffectedRooms() {
        return affectedRooms;
    }

    public void setAffectedRooms(List<RoomResponseDto> affectedRooms) {
        this.affectedRooms = affectedRooms;
    }
}
