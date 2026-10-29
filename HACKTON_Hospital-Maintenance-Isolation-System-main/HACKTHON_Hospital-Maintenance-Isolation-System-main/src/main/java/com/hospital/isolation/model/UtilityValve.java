package com.hospital.isolation.model;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "utility_valves")
public class UtilityValve {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String valveCode;

    @Column(nullable = false, length = 50)
    private String utilityType; // e.g. "MEDICAL_GAS", "OXYGEN", "WATER", "VACUUM", "HVAC"

    @Column(nullable = false, length = 100)
    private String location;

    @Column(length = 255)
    private String description;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "valve_rooms",
        joinColumns = @JoinColumn(name = "valve_id"),
        inverseJoinColumns = @JoinColumn(name = "room_id")
    )
    private Set<Room> affectedRooms = new HashSet<>();

    public UtilityValve() {
    }

    public UtilityValve(String valveCode, String utilityType, String location, String description) {
        this.valveCode = valveCode;
        this.utilityType = utilityType;
        this.location = location;
        this.description = description;
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

    public Set<Room> getAffectedRooms() {
        return affectedRooms;
    }

    public void setAffectedRooms(Set<Room> affectedRooms) {
        this.affectedRooms = affectedRooms;
    }

    public void addRoom(Room room) {
        this.affectedRooms.add(room);
    }

    public void removeRoom(Room room) {
        this.affectedRooms.remove(room);
    }
}
