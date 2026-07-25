package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Repository.UsersRepo;
import com.gradingSystem.GraadingSystem.Service.SchoolContextService;
import com.gradingSystem.GraadingSystem.dto.UserSummaryDTO;
import com.gradingSystem.GraadingSystem.model.Role;
import com.gradingSystem.GraadingSystem.model.School;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UsersController {

    private final UsersRepo usersRepo;
    private final SchoolContextService schoolContextService;

    public UsersController(UsersRepo usersRepo, SchoolContextService schoolContextService) {
        this.usersRepo = usersRepo;
        this.schoolContextService = schoolContextService;
    }

    // Returns all TEACHER accounts for the link-user dropdown — scoped to the current school
    @GetMapping("/teachers")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserSummaryDTO>> getTeacherUsers() {
        School school = schoolContextService.getCurrentSchool();
        List<UserSummaryDTO> result = usersRepo.findBySchool(school).stream()
                .filter(u -> u.getRole() == Role.ROLE_CLASS_TEACHER)
                .map(u -> new UserSummaryDTO(u.getId(), u.getUsername(), u.getRole()))
                .toList();
        return ResponseEntity.ok(result);
    }
}