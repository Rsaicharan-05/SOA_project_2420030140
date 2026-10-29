package com.hospital.isolation.dto;

import com.hospital.isolation.model.IsolationRequest;
import com.hospital.isolation.model.IsolationStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class IsolationRequestResponseDto {

    private Long id;
    private String requestNumber;
    private Long valveId;
    private String valveCode;
    private String utilityType;
    private String valveLocation;
    private String reason;
    private String requestedBy;
    private LocalDateTime requestedAt;
    private IsolationStatus status;
    private LocalDateTime authorizedAt;
    private String authorizedBy;
    private int totalRoomsCount;
    private int acknowledgedRoomsCount;
    private int pendingRoomsCount;
    private List<RoomAcknowledgementResponseDto> acknowledgements;

    public IsolationRequestResponseDto() {
    }

    public static IsolationRequestResponseDto fromEntity(IsolationRequest req) {
        if (req == null) return null;
        IsolationRequestResponseDto dto = new IsolationRequestResponseDto();
        dto.setId(req.getId());
        dto.setRequestNumber(req.getRequestNumber());
        if (req.getValve() != null) {
            dto.setValveId(req.getValve().getId());
            dto.setValveCode(req.getValve().getValveCode());
            dto.setUtilityType(req.getValve().getUtilityType());
            dto.setValveLocation(req.getValve().getLocation());
        }
        dto.setReason(req.getReason());
        dto.setRequestedBy(req.getRequestedBy());
        dto.setRequestedAt(req.getRequestedAt());
        dto.setStatus(req.getStatus());
        dto.setAuthorizedAt(req.getAuthorizedAt());
        dto.setAuthorizedBy(req.getAuthorizedBy());

        if (req.getAcknowledgements() != null) {
            dto.setTotalRoomsCount(req.getAcknowledgements().size());
            int ackCount = (int) req.getAcknowledgements().stream().filter(a -> a.isAcknowledged()).count();
            dto.setAcknowledgedRoomsCount(ackCount);
            dto.setPendingRoomsCount(req.getAcknowledgements().size() - ackCount);
            dto.setAcknowledgements(req.getAcknowledgements().stream()
                    .map(RoomAcknowledgementResponseDto::fromEntity)
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

    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(String requestNumber) {
        this.requestNumber = requestNumber;
    }

    public Long getValveId() {
        return valveId;
    }

    public void setValveId(Long valveId) {
        this.valveId = valveId;
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

    public String getValveLocation() {
        return valveLocation;
    }

    public void setValveLocation(String valveLocation) {
        this.valveLocation = valveLocation;
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

    public int getTotalRoomsCount() {
        return totalRoomsCount;
    }

    public void setTotalRoomsCount(int totalRoomsCount) {
        this.totalRoomsCount = totalRoomsCount;
    }

    public int getAcknowledgedRoomsCount() {
        return acknowledgedRoomsCount;
    }

    public void setAcknowledgedRoomsCount(int acknowledgedRoomsCount) {
        this.acknowledgedRoomsCount = acknowledgedRoomsCount;
    }

    public int getPendingRoomsCount() {
        return pendingRoomsCount;
    }

    public void setPendingRoomsCount(int pendingRoomsCount) {
        this.pendingRoomsCount = pendingRoomsCount;
    }

    public List<RoomAcknowledgementResponseDto> getAcknowledgements() {
        return acknowledgements;
    }

    public void setAcknowledgements(List<RoomAcknowledgementResponseDto> acknowledgements) {
        this.acknowledgements = acknowledgements;
    }
}
