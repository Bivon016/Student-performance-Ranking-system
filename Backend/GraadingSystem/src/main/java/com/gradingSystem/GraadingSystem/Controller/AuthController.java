package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Repository.TeacherAssignmentRepository;
import com.gradingSystem.GraadingSystem.Repository.TeachersRepo;
import com.gradingSystem.GraadingSystem.Repository.UsersRepo;
import com.gradingSystem.GraadingSystem.Service.SchoolContextService;
import com.gradingSystem.GraadingSystem.dto.AssignmentDTO;
import com.gradingSystem.GraadingSystem.dto.LoginResponse;
import com.gradingSystem.GraadingSystem.dto.SignupRequest;
import com.gradingSystem.GraadingSystem.model.Role;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.Teachers;
import com.gradingSystem.GraadingSystem.model.User;
import com.gradingSystem.GraadingSystem.securityConfig.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsersRepo usersRepo;
    private final TeachersRepo teachersRepo;
    private final TeacherAssignmentRepository assignmentRepo;
    private final SchoolContextService  schoolContextService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtService jwtService,
                          UsersRepo usersRepo,
                          TeachersRepo teachersRepo,
                          TeacherAssignmentRepository assignmentRepo,SchoolContextService schoolContextService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.usersRepo = usersRepo;
        this.teachersRepo = teachersRepo;
        this.assignmentRepo = assignmentRepo;
        this.schoolContextService = schoolContextService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody SignupRequest request) {

        // ✅ Authenticate first
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword()
                )
        );

        // ✅ Now we can safely load the user
        User user = usersRepo.findByUsername(request.getUsername());

        // ✅ Get school directly from user, not from security context
        School school = user.getSchool();
        if (school == null) throw new RuntimeException("User is not linked to a school");

        String token = jwtService.generateToken(request.getUsername());

        Teachers teacher = teachersRepo.findByUserIdAndSchool(user.getId(), school)
                .orElse(null);

        List<AssignmentDTO> assignments = List.of();
        if (teacher != null) {
            assignments = assignmentRepo.findByTeacherAndSchool(teacher, school)
                    .stream()
                    .map(a -> new AssignmentDTO(
                            a.getId(),
                            a.getSubject().getSubjectId(),
                            a.getSubject().getSubjectName(),
                            a.getAssignedClass().getClassId(),
                            a.getAssignedClass().getClassName()
                    ))
                    .toList();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("role", user.getRole());
        response.put("assignments", assignments);
        response.put("username", user.getUsername());

        return ResponseEntity.ok(response);
    }
    @GetMapping("/users/all")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(usersRepo.findAll());
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<User> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User user = usersRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(Role.valueOf(body.get("role")));
        return ResponseEntity.ok(usersRepo.save(user));
    }
}