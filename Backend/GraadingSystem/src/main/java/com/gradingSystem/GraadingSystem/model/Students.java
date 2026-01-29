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

    @Column(name = "form")
    private int form;

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

    public int getForm() {
        return form;
    }

    public void setForm(int form) {
        this.form = form;
    }

    @Override
    public String toString() {
        return "Students{" +
                "id=" + id +
                ", firstName='" + firstName + '\'' +
                ", secondName='" + secondName + '\'' +
                ", gender='" + gender + '\'' +
                ", form=" + form +
                '}';
    }
}
