package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Repository.TeacherAssignmentRepository;
import com.gradingSystem.GraadingSystem.Repository.TeachersRepo;
import com.gradingSystem.GraadingSystem.Repository.UsersRepo;
import com.gradingSystem.GraadingSystem.dto.AssignmentDTO;
import com.gradingSystem.GraadingSystem.dto.LoginResponse;
import com.gradingSystem.GraadingSystem.dto.SignupRequest;
import com.gradingSystem.GraadingSystem.model.User;
import com.gradingSystem.GraadingSystem.securityConfig.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsersRepo usersRepo;
    private final TeachersRepo teachersRepo;
    private final TeacherAssignmentRepository assignmentRepo;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtService jwtService,
                          UsersRepo usersRepo,
                          TeachersRepo teachersRepo,
                          TeacherAssignmentRepository assignmentRepo) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.usersRepo = usersRepo;
        this.teachersRepo = teachersRepo;
        this.assignmentRepo = assignmentRepo;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody SignupRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword()
                )
        );

        String token = jwtService.generateToken(request.getUsername());
        User user = usersRepo.findByUsername(request.getUsername());

        List<AssignmentDTO> assignments = teachersRepo.findByUserId(user.getId())
                .map(teacher -> assignmentRepo.findByTeacher(teacher)
                        .stream()
                        .map(a -> new AssignmentDTO(
                                a.getId(),
                                a.getSubject().getSubjectId(),
                                a.getSubject().getSubjectName(),
                                a.getAssignedClass().getClassId(),   // ✅ updated
                                a.getAssignedClass().getClassName()  // ✅ updated
                        ))
                        .toList()
                )
                .orElse(List.of());

        return new LoginResponse(token, user.getRole(), assignments);
    }
}