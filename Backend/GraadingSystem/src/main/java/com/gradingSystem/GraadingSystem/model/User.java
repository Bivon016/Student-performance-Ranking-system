package com.gradingSystem.GraadingSystem.model;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Entity
@Table(name = "Users")
public class User {

    @Id
    @Column(name = "User_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "Username" , nullable = false)
    private String username;

    @Column(name = "Password")
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "Role")
    private Role role;

    public void setRole(Role role) {
        this.role = role;
    }

    public Long getId() {

        return id;
    }

    public void setId(Long id) {

        this.id = id;
    }

    public String getUsername() {

        return username;
    }

    public void setUsername(String username) {

        this.username = username;
    }

    public String getPassword() {

        return password;
    }

    public Role getRole() {
        return role;
    }

    public void setPassword(String password) {

        this.password = password;
    }
}
