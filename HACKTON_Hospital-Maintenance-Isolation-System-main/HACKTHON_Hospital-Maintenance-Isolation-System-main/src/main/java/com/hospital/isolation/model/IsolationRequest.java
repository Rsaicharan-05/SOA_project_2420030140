package com.hospital.isolation.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "isolation_requests")
public class IsolationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String requestNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "valve_id", nullable = false)
    private UtilityValve valve;

    @Column(nullable = false, length = 255)
    private String reason;

    @Column(nullable = false, length = 50)
    private String requestedBy;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private IsolationStatus status = IsolationStatus.PENDING_ACKNOWLEDGEMENTS;

    private LocalDateTime authorizedAt;

    @Column(length = 50)
    private String authorizedBy;

    @OneToMany(mappedBy = "isolationRequest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<RoomAcknowledgement> acknowledgements = new ArrayList<>();

    public IsolationRequest() {
    }

    public IsolationRequest(String requestNumber, UtilityValve valve, String reason, String requestedBy) {
        this.requestNumber = requestNumber;
        this.valve = valve;
        this.reason = reason;
        this.requestedBy = requestedBy;
        this.requestedAt = LocalDateTime.now();
        this.status = IsolationStatus.PENDING_ACKNOWLEDGEMENTS;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(String requestNumber) {
        this.requestNumber = requestNumber;
    }

    public UtilityValve getValve() {
        return valve;
    }

    public void setValve(UtilityValve valve) {
        this.valve = valve;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(String requestedBy) {
        this.requestedBy = requestedBy;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public IsolationStatus getStatus() {
        return status;
    }

    public void setStatus(IsolationStatus status) {
        this.status = status;
    }

    public LocalDateTime getAuthorizedAt() {
        return authorizedAt;
    }

    public void setAuthorizedAt(LocalDateTime authorizedAt) {
        this.authorizedAt = authorizedAt;
    }

    public String getAuthorizedBy() {
        return authorizedBy;
    }

    public void setAuthorizedBy(String authorizedBy) {
        this.authorizedBy = authorizedBy;
    }

    public List<RoomAcknowledgement> getAcknowledgements() {
        return acknowledgements;
    }

    public void setAcknowledgements(List<RoomAcknowledgement> acknowledgements) {
        this.acknowledgements = acknowledgements;
    }

    public void addAcknowledgement(RoomAcknowledgement acknowledgement) {
        this.acknowledgements.add(acknowledgement);
        acknowledgement.setIsolationRequest(this);
    }

    public boolean isFullyAcknowledged() {
        if (acknowledgements == null || acknowledgements.isEmpty()) {
            return false;
        }
        return acknowledgements.stream().allMatch(RoomAcknowledgement::isAcknowledged);
    }

    public List<Room> getPendingRooms() {
        if (acknowledgements == null) {
            return List.of();
        }
        return acknowledgements.stream()
                .filter(ack -> !ack.isAcknowledged())
                .map(RoomAcknowledgement::getRoom)
                .collect(Collectors.toList());
    }
}
