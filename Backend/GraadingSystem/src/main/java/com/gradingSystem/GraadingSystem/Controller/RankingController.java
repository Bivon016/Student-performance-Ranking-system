package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.dto.ResultsResponseDTO;
import com.gradingSystem.GraadingSystem.dto.StudentRankingDTO;
import com.gradingSystem.GraadingSystem.Service.RankingService;
import com.gradingSystem.GraadingSystem.model.ExamType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ranking")
@CrossOrigin(origins = "http://localhost:5173")
public class RankingController {

    @Autowired
    private RankingService rankingService;

    // Legacy endpoint — kept for backwards compatibility
    @GetMapping("/form/{form}")
    public List<StudentRankingDTO> getFormRanking(@PathVariable int form) {
        return rankingService.rankStudentsByForm(form);
    }

    /**
     * Main results endpoint.
     * GET /ranking/results?classIds=5,6&examType=MIDTERM
     *
     * classIds  — comma-separated list of class IDs to include
     * examType  — one of: FINAL_EXAM, MIDTERM, QUIZ, ASSIGNMENT, LAB_WORK, PROJECT
     */
    @GetMapping("/results")
    public ResponseEntity<?> getResults(
            @RequestParam List<Long> classIds,
            @RequestParam String examType) {
        try {
            ExamType type = ExamType.valueOf(examType.toUpperCase());
            ResultsResponseDTO results = rankingService.generateResults(classIds, type);
            return ResponseEntity.ok(results);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid exam type: " + examType);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}