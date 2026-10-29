package com.hospital.isolation.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_acknowledgements")
public class RoomAcknowledgement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "isolation_request_id", nullable = false)
    @JsonIgnore
    private IsolationRequest isolationRequest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private boolean acknowledged = false;

    private LocalDateTime acknowledgedAt;

    @Column(length = 50)
    private String acknowledgedBy;

    @Column(length = 255)
    private String notes;

    public RoomAcknowledgement() {
    }

    public RoomAcknowledgement(IsolationRequest isolationRequest, Room room) {
        this.isolationRequest = isolationRequest;
        this.room = room;
        this.acknowledged = false;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public IsolationRequest getIsolationRequest() {
        return isolationRequest;
    }

    public void setIsolationRequest(IsolationRequest isolationRequest) {
        this.isolationRequest = isolationRequest;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
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
