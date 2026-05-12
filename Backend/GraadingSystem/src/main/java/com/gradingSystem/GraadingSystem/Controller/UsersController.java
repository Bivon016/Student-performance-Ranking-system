package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Repository.UsersRepo;
import com.gradingSystem.GraadingSystem.dto.UserSummaryDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.StreamSupport;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UsersController {

    private final UsersRepo usersRepo;

    public UsersController(UsersRepo usersRepo) {
        this.usersRepo = usersRepo;
    }

    // Returns all TEACHER accounts for the link-user dropdown
    @GetMapping("/teachers")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserSummaryDTO>> getTeacherUsers() {
        List<UserSummaryDTO> result = StreamSupport
                .stream(usersRepo.findAll().spliterator(), false)
                .filter(u -> "TEACHER".equals(u.getRole()))
                .map(u -> new UserSummaryDTO(u.getId(), u.getUsername(), u.getRole()))
                .toList();
        return ResponseEntity.ok(result);
    }
}