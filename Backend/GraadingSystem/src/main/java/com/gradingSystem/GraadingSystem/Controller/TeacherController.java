package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.TeachersService;
import com.gradingSystem.GraadingSystem.dto.AssignmentDTO;
import com.gradingSystem.GraadingSystem.dto.LinkUserRequest;
import com.gradingSystem.GraadingSystem.dto.TeacherAssignmentRequest;
import com.gradingSystem.GraadingSystem.model.Teachers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teachers")
@CrossOrigin(origins = "http://localhost:5173")
public class TeacherController {

    @Autowired
    public TeachersService teachersService;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @PostMapping("/add")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<Teachers> addTeacher(@RequestBody Teachers teacher) {
        System.out.println(teacher);
        return ResponseEntity.ok(teachersService.addTeacher(teacher));

    }

    // ✅ Fixed: was mapped to /teachers/teachers
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<List<Teachers>> getAllTeachers() {
        return ResponseEntity.ok(teachersService.getAllTeachers());
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<String> deleteTeacher(@PathVariable Long id) {
        teachersService.deleteTeacher(id);
        return ResponseEntity.ok("Teacher deleted successfully");
    }

    // ── Link teacher → user account ───────────────────────────────────────────

    @PutMapping("/{teacherId}/link-user")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<Teachers> linkUser(
            @PathVariable Long teacherId,
            @RequestBody LinkUserRequest request) {
        return ResponseEntity.ok(teachersService.linkUser(teacherId, request.getUserId()));
    }

    // ── Subject+class assignments ─────────────────────────────────────────────

    @PostMapping("/{teacherId}/assignments")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<AssignmentDTO> addAssignment(
            @PathVariable Long teacherId,
            @RequestBody TeacherAssignmentRequest request) {
        return ResponseEntity.ok(teachersService.addAssignment(teacherId, request));
    }

    @GetMapping("/{teacherId}/assignments")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<List<AssignmentDTO>> getAssignments(
            @PathVariable Long teacherId) {
        return ResponseEntity.ok(teachersService.getAssignments(teacherId));
    }

    @DeleteMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    public ResponseEntity<String> deleteAssignment(
            @PathVariable Long assignmentId) {
        teachersService.deleteAssignment(assignmentId);
        return ResponseEntity.ok("Assignment removed");
    }

}