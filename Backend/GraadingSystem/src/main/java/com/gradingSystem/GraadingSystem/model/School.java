package com.gradingSystem.GraadingSystem.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})

public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long schoolId;

    @Column(nullable = false)
    private String schoolName;

    @Column(unique = true)
    private String schoolCode;

    @Column(length = 500)
    private String schoolLogo;

    @Enumerated(EnumType.STRING)
    private SchoolType schoolType;

    private String city;
    private String country;
    private String postalAddress;

    private String phoneNumber;

    @Column(unique = true)
    private String email;

    private String motto;

    private Boolean active;

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.active = true;
    }

    public School() {}

    public School(Long schoolId, String schoolName, String schoolCode, String schoolLogo, SchoolType schoolType, String city, String country,
                  String phoneNumber, String postalAddress, String email, String motto, Boolean active, LocalDateTime createdAt) {
        this.schoolId = schoolId;
        this.schoolName = schoolName;
        this.schoolCode = schoolCode;
        this.schoolLogo = schoolLogo;
        this.schoolType = schoolType;
        this.city = city;
        this.country = country;
        this.phoneNumber = phoneNumber;
        this.postalAddress = postalAddress;
        this.email = email;
        this.motto = motto;

    }

    public Long getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(Long schoolId) {
        this.schoolId = schoolId;
    }

    public Boolean isActive() {
        return active; }
    public void setActive(Boolean active) {
        this.active = active; }

    public String getSchoolName() {
        return schoolName;
    }

    public void setSchoolName(String schoolName) {
        this.schoolName = schoolName;
    }

    public String getSchoolCode() {
        return schoolCode;
    }

    public void setSchoolCode(String schoolCode) {
        this.schoolCode = schoolCode;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getSchoolLogo() {
        return schoolLogo;
    }

    public void setSchoolLogo(String schoolLogo) {
        this.schoolLogo = schoolLogo;
    }

    public SchoolType getSchoolType() {
        return schoolType;
    }

    public void setSchoolType(SchoolType schoolType) {
        this.schoolType = schoolType;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPostalAddress() {
        return postalAddress;
    }

    public void setPostalAddress(String postalAddress) {
        this.postalAddress = postalAddress;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMotto() {
        return motto;
    }

    public void setMotto(String motto) {
        this.motto = motto;
    }
}


