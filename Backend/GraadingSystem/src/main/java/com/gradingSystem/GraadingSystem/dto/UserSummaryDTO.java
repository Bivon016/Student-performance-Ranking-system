package com.gradingSystem.GraadingSystem.dto;

import com.gradingSystem.GraadingSystem.model.Role;

public class UserSummaryDTO {
    private Long id;
    private String username;
    private Role role;

    public UserSummaryDTO(Long id, String username, Role role) {
        this.id = id;
        this.username = username;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public Role getRole() { return role; }
}