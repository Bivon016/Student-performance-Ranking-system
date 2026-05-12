package com.gradingSystem.GraadingSystem.dto;

import java.util.List;

public class LoginResponse {
    private String token;
    private String role;
    private List<AssignmentDTO> assignments;

    public LoginResponse(String token, String role, List<AssignmentDTO> assignments) {
        this.token = token;
        this.role = role;
        this.assignments = assignments;
    }

    public String getToken() { return token; }
    public String getRole() { return role; }
    public List<AssignmentDTO> getAssignments() { return assignments; }
}