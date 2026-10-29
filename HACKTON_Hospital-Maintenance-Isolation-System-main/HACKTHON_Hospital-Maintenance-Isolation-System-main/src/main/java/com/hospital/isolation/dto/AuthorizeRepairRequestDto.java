package com.hospital.isolation.dto;

public class AuthorizeRepairRequestDto {

    private String notes;

    public AuthorizeRepairRequestDto() {
    }

    public AuthorizeRepairRequestDto(String notes) {
        this.notes = notes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
