package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Repository.UsersRepo;
import com.gradingSystem.GraadingSystem.Service.SchoolService;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/school")
public class SchoolController {

    private final SchoolService schoolService;
    private final UsersRepo usersRepo;

    public SchoolController(SchoolService schoolService, UsersRepo usersRepo) {
        this.schoolService = schoolService;
        this.usersRepo = usersRepo;
    }
    @PostMapping("/register")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<School> registerSchool(
            @RequestBody School school,
            Authentication authentication) {
        User creator = usersRepo.findByUsername(authentication.getName());
        return ResponseEntity.ok(schoolService.registerSchool(school, creator));
    }
    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<School>> getAllSchools() {
        return ResponseEntity.ok(schoolService.getAllSchools());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<School> getSchoolById(@PathVariable Long id) {
        return ResponseEntity.ok(schoolService.getSchoolById(id));
    }

    @GetMapping("/code/{schoolCode}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<School> getBySchoolCode(@PathVariable String schoolCode) {
        return ResponseEntity.ok(schoolService.getBySchoolCode(schoolCode));
    }

    @PutMapping("/update/{id}")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<School> updateSchool(
            @PathVariable Long id,
            @RequestBody School school) {
        return ResponseEntity.ok(schoolService.updateSchool(id, school));
    }

    @PostMapping("/{id}/logo")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<Map<String, Object>> uploadLogo(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        School school = schoolService.uploadSchoolLogo(id, file);
        return ResponseEntity.ok(Map.of(
                "schoolLogo", school.getSchoolLogo(),
                "logoUrl", school.getSchoolLogo(),
                "school", school
        ));
    }

    @DeleteMapping("/{id}/logo")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<School> deleteLogo(@PathVariable Long id) {
        return ResponseEntity.ok(schoolService.removeSchoolLogo(id));
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<String> deleteSchool(@PathVariable Long id) {
        schoolService.deleteSchool(id);
        return ResponseEntity.ok("School deactivated successfully");
    }
    @GetMapping("/current")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<School> getCurrentSchool() {
        return ResponseEntity.ok(schoolService.getCurrentSchoolForUser());
    }
}