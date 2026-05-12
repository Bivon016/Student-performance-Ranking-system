package com.gradingSystem.GraadingSystem.model;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class UserPrincipal implements UserDetails {

    private final User users;

    public UserPrincipal(User users) {
        this.users = users;
    }

    // ✅ Now reads the actual Role from the database
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singleton(
                new SimpleGrantedAuthority(users.getRole())
        );
    }

    // ✅ Expose underlying User so services can read the id
    public User getUser() {
        return users;
    }

    @Override
    public String getPassword() { return users.getPassword(); }

    @Override
    public String getUsername() { return users.getUsername(); }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}