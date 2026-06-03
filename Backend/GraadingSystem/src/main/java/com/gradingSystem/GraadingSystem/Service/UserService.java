package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.UsersRepo;
import com.gradingSystem.GraadingSystem.dto.SignupRequest;
import com.gradingSystem.GraadingSystem.model.Role;
import com.gradingSystem.GraadingSystem.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UsersRepo userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.principal-code}")  // ✅ reads from application.properties
    private String principalCode;

    public String registerUser(SignupRequest request) {

        if (userRepo.existsByUsername(request.getUsername())) {
            return "Username already taken!";
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // ✅ Assign ROLE_PRINCIPAL if code matches, otherwise ROLE_SUBJECT_TEACHER
        if (principalCode != null
                && principalCode.equals(request.getPrincipalCode())) {
            user.setRole(Role.ROLE_PRINCIPAL);
        } else {
            user.setRole(Role.ROLE_SUBJECT_TEACHER);
        }

        userRepo.save(user);
        return "User registered successfully!";
    }
}