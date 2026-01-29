package com.gradingSystem.GraadingSystem.model;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;


@NoArgsConstructor
@Entity
@Table(name = "teachers")
public class Teachers {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "teacher_id")
    private Long id;

    @Column(name = "firstName", nullable = false)
    private String firstName;

    @Column(name = "secondName", nullable = false)
    private String secondName;


    @Column(name = "email", nullable = false)
    private String email;

    public Long getId() {

        return id;
    }

    public void setId(Long id) {

        this.id = id;
    }

    public String getFirstName()
    {
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @Override
    public String toString() {
        return "Teachers{" +
                "id=" + id +
                ", firstName='" + firstName + '\'' +
                ", secondName='" + secondName + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}