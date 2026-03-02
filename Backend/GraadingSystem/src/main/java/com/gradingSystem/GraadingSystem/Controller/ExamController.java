package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.ExamService;
import com.gradingSystem.GraadingSystem.dto.ExamRequestDTO;
import com.gradingSystem.GraadingSystem.dto.ExamResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exams")
@CrossOrigin(origins = "http://localhost:5173")
public class ExamController {

    @Autowired
    private ExamService examService;

    // POST /exams/create
    @PostMapping("/create")
    public ResponseEntity<ExamResponseDTO> createExam(@RequestBody ExamRequestDTO dto) {
        return ResponseEntity.ok(examService.createExam(dto));
    }

    // GET /exams/all
    @GetMapping("/all")
    public ResponseEntity<List<ExamResponseDTO>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }

    // GET /exams/filter?subjectId=1&form=2
    @GetMapping("/filter")
    public ResponseEntity<List<ExamResponseDTO>> getBySubjectAndForm(
            @RequestParam Long subjectId,
            @RequestParam int form
    ) {
        return ResponseEntity.ok(examService.getExamsBySubjectAndForm(subjectId, form));
    }

    // GET /exams/form/{form}
    @GetMapping("/form/{form}")
    public ResponseEntity<List<ExamResponseDTO>> getByForm(@PathVariable int form) {
        return ResponseEntity.ok(examService.getExamsByForm(form));
    }

    // DELETE /exams/delete/{examId}
    @DeleteMapping("/delete/{examId}")
    public ResponseEntity<String> deleteExam(@PathVariable Long examId) {
        examService.deleteExam(examId);
        return ResponseEntity.ok("Exam deleted successfully");
    }
}