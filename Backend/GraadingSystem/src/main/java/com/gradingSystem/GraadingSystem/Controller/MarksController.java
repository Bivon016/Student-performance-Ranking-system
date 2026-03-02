package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.MarksService;
import com.gradingSystem.GraadingSystem.dto.MarksBatchRequest;
import com.gradingSystem.GraadingSystem.dto.MarksResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/marks")
@CrossOrigin(origins = "http://localhost:5173")
public class MarksController {

    @Autowired
    private MarksService marksService;

    // POST /marks/add
    @PostMapping("/add")
    public ResponseEntity<List<MarksResponseDTO>> addMarksBatch(
            @RequestBody MarksBatchRequest request) {
        return ResponseEntity.ok(marksService.addMarksForManyStudents(request));
    }

    // GET /marks/all
    @GetMapping("/allmarks")
    public ResponseEntity<List<MarksResponseDTO>> getAllMarks() {
        return ResponseEntity.ok(marksService.getAllMarks());
    }

    // GET /marks/student/{studentId}
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<MarksResponseDTO>> getMarksByStudent(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(marksService.getMarksByStudent(studentId));
    }

    // GET /marks/subject/{subjectId}
    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<MarksResponseDTO>> getMarksBySubject(
            @PathVariable Long subjectId) {
        return ResponseEntity.ok(marksService.getMarksBySubject(subjectId));
    }

    // GET /marks/exam/{examId}  ← NEW
    @GetMapping("/exam/{examId}")
    public ResponseEntity<List<MarksResponseDTO>> getMarksByExam(
            @PathVariable Long examId) {
        return ResponseEntity.ok(marksService.getMarksByExam(examId));
    }

    // PUT /marks/update/{markId}?marksValue=85
    @PutMapping("/update/{markId}")
    public ResponseEntity<MarksResponseDTO> updateMarks(
            @PathVariable Long markId,
            @RequestParam int marksValue) {
        return ResponseEntity.ok(marksService.updateMarks(markId, marksValue));
    }

    // DELETE /marks/delete/{markId}
    @DeleteMapping("/delete/{markId}")
    public ResponseEntity<String> deleteMarks(@PathVariable Long markId) {
        marksService.deleteMarks(markId);
        return ResponseEntity.ok("Marks deleted successfully");
    }
}