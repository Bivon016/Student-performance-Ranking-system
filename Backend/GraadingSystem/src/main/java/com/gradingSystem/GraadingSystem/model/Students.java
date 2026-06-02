package com.gradingSystem.GraadingSystem.model;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Entity
public class Students {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "second_name")
    private String secondName;

    @Column(name = "gender", nullable = false)
    private String gender;

    @Column(name = "class_id")
    private Long classId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;

    public School getSchool() {
        return school;
    }

    public void setSchool(School school) {
        this.school = school;
    }
    public Students(Long id, School school, Long classId, String gender, String secondName, String firstName) {
        this.id = id;
        this.school = school;
        this.classId = classId;
        this.gender = gender;
        this.secondName = secondName;
        this.firstName = firstName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getSecondName() {
        return secondName;
    }

    public void setSecondName(String secondName) {
        this.secondName = secondName;
    }

    public String getGender() {
        return gender;
    }



    public void setGender(String gender) {
        this.gender = gender;
    }

    public Long getClassId() {
        return classId;
    }

    public void setClassId(Long classId) {
        this.classId = classId;
    }


}