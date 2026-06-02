package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.SchoolService;
import com.gradingSystem.GraadingSystem.model.School;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/school")
@CrossOrigin(origins = "http://localhost:5173")
public class SchoolController {

    private final SchoolService schoolService;

    public SchoolController(SchoolService schoolService) {
        this.schoolService = schoolService;
    }
    @PostMapping("/register")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<School> registerSchool(@RequestBody School school) {
        return ResponseEntity.ok(schoolService.registerSchool(school));
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
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<School> updateSchool(
            @PathVariable Long id,
            @RequestBody School school) {
        return ResponseEntity.ok(schoolService.updateSchool(id, school));
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<String> deleteSchool(@PathVariable Long id) {
        schoolService.deleteSchool(id);
        return ResponseEntity.ok("School deactivated successfully");
    }
}