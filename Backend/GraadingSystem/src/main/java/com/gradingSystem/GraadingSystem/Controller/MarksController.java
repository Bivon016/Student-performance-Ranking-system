package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.GradeService;
import com.gradingSystem.GraadingSystem.Service.MarksService;
import com.gradingSystem.GraadingSystem.dto.MarksBatchRequest;
import com.gradingSystem.GraadingSystem.dto.MarksResponseDTO;
import com.gradingSystem.GraadingSystem.dto.StudentComparisonDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/marks")
@CrossOrigin(origins = "http://localhost:5173")
public class MarksController {

    @Autowired
    private MarksService marksService;

    @Autowired
    private GradeService gradeService;

    // 🔒 Only the assigned teacher for this subject+class, or ADMIN
    @PostMapping("/add")
    @PreAuthorize("hasRole('PRINCIPAL') or " +
            "@teacherAuthService.isAssignedTo(#request.subjectId, #request.classId)")
    public ResponseEntity<List<MarksResponseDTO>> addMarksBatch(
            @RequestBody MarksBatchRequest request) {
        return ResponseEntity.ok(marksService.addMarksForManyStudents(request));
    }

    // ✅ Any authenticated user can read
    @GetMapping("/allmarks")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MarksResponseDTO>> getAllMarks() {
        return ResponseEntity.ok(marksService.getAllMarks());
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MarksResponseDTO>> getMarksByStudent(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(marksService.getMarksByStudent(studentId));
    }

    @GetMapping("/subject/{subjectId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MarksResponseDTO>> getMarksBySubject(
            @PathVariable Long subjectId) {
        return ResponseEntity.ok(marksService.getMarksBySubject(subjectId));
    }

    @GetMapping("/exam/{examId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MarksResponseDTO>> getMarksByExam(
            @PathVariable Long examId) {
        return ResponseEntity.ok(marksService.getMarksByExam(examId));
    }

    // 🔒 Teacher needs subjectId+classId passed as params to verify ownership
    @PutMapping("/update/{markId}")
    @PreAuthorize("hasRole('PRINCIPAL') or " +
            "@teacherAuthService.isAssignedTo(#subjectId, #classId)")
    public ResponseEntity<MarksResponseDTO> updateMarks(
            @PathVariable Long markId,
            @RequestParam int marksValue,
            @RequestParam Long subjectId,    // ✅ ADD — needed for auth check
            @RequestParam Long classId) {    // ✅ ADD — needed for auth check
        return ResponseEntity.ok(marksService.updateMarks(markId, marksValue));
    }

    // 🔒 Only ADMIN can delete marks
    @DeleteMapping("/delete/{markId}")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<String> deleteMarks(@PathVariable Long markId) {
        marksService.deleteMarks(markId);
        return ResponseEntity.ok("Marks deleted successfully");
    }

    @GetMapping("/grades/{studentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getStudentGrades(@PathVariable Long studentId) {
        return ResponseEntity.ok(gradeService.getStudentGrades(studentId));
    }

    //debugging
    @GetMapping("/test-auth")
    public String testAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("Authorities: " + auth.getAuthorities());
        System.out.println("Username: " + auth.getName());
        return "Check your console";
    }
    @GetMapping("/exam/{examId}/comparison")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<StudentComparisonDTO>> getExamComparison(
            @PathVariable Long examId) {
        return ResponseEntity.ok(marksService.getExamComparison(examId));
    }
}