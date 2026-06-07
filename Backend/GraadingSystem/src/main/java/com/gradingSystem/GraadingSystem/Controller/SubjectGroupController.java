package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.SubjectGroupService;
import com.gradingSystem.GraadingSystem.dto.SubjectGroupDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subject-groups")
public class SubjectGroupController {

    private final SubjectGroupService subjectGroupService;

    public SubjectGroupController(SubjectGroupService subjectGroupService) {
        this.subjectGroupService = subjectGroupService;
    }

    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SubjectGroupDTO>> getAllSubjectGroups() {
        return ResponseEntity.ok(subjectGroupService.getAllSubjectGroups());
    }

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<SubjectGroupDTO> createSubjectGroup(
            @RequestBody SubjectGroupDTO dto) {
        return ResponseEntity.ok(subjectGroupService.createNewSubjectGroup(dto));
    }

    @PutMapping("/update/{id}")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<SubjectGroupDTO> updateSubjectGroup(
            @PathVariable Long id,
            @RequestBody SubjectGroupDTO dto) {
        return ResponseEntity.ok(subjectGroupService.updateSubjectGroup(id, dto));
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<String> deleteSubjectGroup(@PathVariable Long id) {
        subjectGroupService.deleteSubjectGroup(id);
        return ResponseEntity.ok("Subject group deleted successfully");
    }
}