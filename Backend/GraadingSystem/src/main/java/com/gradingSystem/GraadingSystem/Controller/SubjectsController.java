package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.SubjectsService;
import com.gradingSystem.GraadingSystem.dto.SubjectDTO;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subjects")
public class SubjectsController {

    private final SubjectsService subjectsService;

    public SubjectsController(SubjectsService subjectsService) {
        this.subjectsService = subjectsService;
    }

    @PostMapping("/addSubjects")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<SubjectDTO> addSubject(@RequestBody Subjects subject) {
        return ResponseEntity.ok(subjectsService.addSubject(subject));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SubjectDTO> viewSubject(@PathVariable Long id) {
        return ResponseEntity.ok(subjectsService.viewSubject(id));
    }

    @GetMapping("/allSubjects")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SubjectDTO>> viewAllSubjects() {
        return ResponseEntity.ok(subjectsService.viewAllSubjects());
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<String> deleteSubject(@PathVariable Long id) {
        subjectsService.deleteSubject(id);
        return ResponseEntity.ok("Subject deleted successfully");
    }

    @PutMapping("/update/{id}")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<SubjectDTO> updateSubject(
            @PathVariable Long id,
            @RequestBody Subjects subject) {
        return ResponseEntity.ok(subjectsService.updateSubject(id, subject));
    }
}