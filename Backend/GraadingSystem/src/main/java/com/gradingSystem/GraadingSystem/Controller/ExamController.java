package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.ExamService;
import com.gradingSystem.GraadingSystem.dto.ExamRequestDTO;
import com.gradingSystem.GraadingSystem.dto.ExamResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exams")
@CrossOrigin(origins = "http://localhost:5173")
public class ExamController {

    @Autowired
    private ExamService examService;

    // 🔒 Only the assigned teacher for this subject+class, or ADMIN
    @PostMapping("/create")
    @PreAuthorize("hasRole('PRINCIPAL') or " +
            "@teacherAuthService.isAssignedTo(#dto.subjectId, #dto.classId)")
    public ResponseEntity<ExamResponseDTO> createExam(@RequestBody ExamRequestDTO dto) {
        return ResponseEntity.ok(examService.createExam(dto));
    }

    // ✅ Any authenticated user can read
    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ExamResponseDTO>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }

    @GetMapping("/filter")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ExamResponseDTO>> getBySubjectAndForm(
            @RequestParam Long subjectId,
            @RequestParam int form) {
        return ResponseEntity.ok(examService.getExamsBySubjectAndForm(subjectId, form));
    }

    @GetMapping("/form/{form}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ExamResponseDTO>> getByForm(@PathVariable int form) {
        return ResponseEntity.ok(examService.getExamsByForm(form));
    }

    // 🔒 Only ADMIN can delete exams
    @DeleteMapping("/delete/{examId}")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<String> deleteExam(@PathVariable Long examId) {
        examService.deleteExam(examId);
        return ResponseEntity.ok("Exam deleted successfully");
    }
}