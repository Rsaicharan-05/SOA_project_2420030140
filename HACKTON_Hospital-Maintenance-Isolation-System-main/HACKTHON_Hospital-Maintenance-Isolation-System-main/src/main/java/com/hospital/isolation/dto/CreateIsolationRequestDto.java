package com.hospital.isolation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateIsolationRequestDto {

    @NotNull(message = "Valve ID is required")
    private Long valveId;

    @NotBlank(message = "Reason for isolation maintenance is required")
    private String reason;

    public CreateIsolationRequestDto() {
    }

    public CreateIsolationRequestDto(Long valveId, String reason) {
        this.valveId = valveId;
        this.reason = reason;
    }

    public Long getValveId() {
        return valveId;
    }

    public void setValveId(Long valveId) {
        this.valveId = valveId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
