package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Repository.SchoolRepo;
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
import org.springframework.security.core.Authentication;

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
    private final SchoolRepo schoolRepo;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtService jwtService,
                          UsersRepo usersRepo,
                          TeachersRepo teachersRepo,
                          TeacherAssignmentRepository assignmentRepo,SchoolContextService schoolContextService,SchoolRepo schoolRepo) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.usersRepo = usersRepo;
        this.teachersRepo = teachersRepo;
        this.assignmentRepo = assignmentRepo;
        this.schoolContextService = schoolContextService;
        this.schoolRepo = schoolRepo;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody SignupRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword()
                )
        );

        User user = usersRepo.findByUsername(request.getUsername());
        String token = jwtService.generateToken(request.getUsername());

        // ✅ No school yet — return flag instead of throwing
        School school = user.getSchool();
        if (school == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("token",          token);
            response.put("role",           user.getRole());
            response.put("assignments",    List.of());
            response.put("username",       user.getUsername());
            response.put("requiresSchool", true);          // ✅ frontend reads this
            return ResponseEntity.ok(response);
        }

        // Normal login — school exists
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
        response.put("token",       token);
        response.put("role",        user.getRole());
        response.put("assignments", assignments);
        response.put("username",    user.getUsername());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/all")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<List<User>> getAllUsers() {
        School school = schoolContextService.getCurrentSchool();
        return ResponseEntity.ok(usersRepo.findBySchool(school));
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
    @PutMapping("/users/link-school")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> linkSchool(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        User user = usersRepo.findByUsername(authentication.getName());
        School school = schoolRepo.findBySchoolCode(body.get("schoolCode"))
                .orElseThrow(() -> new RuntimeException("School not found"));
        user.setSchool(school);
        usersRepo.save(user);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Joined successfully");
        response.put("schoolName", school.getSchoolName());
        return ResponseEntity.ok(response);
    }
}