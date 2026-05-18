package com.gradingSystem.GraadingSystem.dto;


public class SignupRequest {
    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    private String username;
    private String role;
    private String password;

    public SignupRequest() {}

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
