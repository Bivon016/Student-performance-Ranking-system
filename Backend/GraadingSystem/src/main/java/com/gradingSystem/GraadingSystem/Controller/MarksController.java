package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.MarksService;
import com.gradingSystem.GraadingSystem.dto.MarksBatchRequest;
import com.gradingSystem.GraadingSystem.dto.MarksResponseDTO;
import com.gradingSystem.GraadingSystem.model.Marks;
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

    @PostMapping("/add")
    public ResponseEntity<List<MarksResponseDTO>> addMarksBatch(
            @RequestBody MarksBatchRequest request
    ) {
        return ResponseEntity.ok(
                marksService.addMarksForManyStudents(request)
        );
    }

    @GetMapping("/all")
    public ResponseEntity<List<MarksResponseDTO>> getAllMarks() {
        return ResponseEntity.ok(marksService.getAllMarks());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<MarksResponseDTO>> getMarksByStudent(
            @PathVariable Long studentId
    ) {
        return ResponseEntity.ok(
                marksService.getMarksByStudent(studentId)
        );
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<MarksResponseDTO>> getMarksBySubject(
            @PathVariable Long subjectId
    ) {
        return ResponseEntity.ok(
                marksService.getMarksBySubject(subjectId)
        );
    }

    @PutMapping("/update/{markId}")
    public ResponseEntity<MarksResponseDTO> updateMarks(
            @PathVariable Long markId,
            @RequestParam int marksValue
    ) {
        return ResponseEntity.ok(
                marksService.updateMarks(markId, marksValue)
        );
    }

    @DeleteMapping("/delete/{markId}")
    public ResponseEntity<String> deleteMarks(
            @PathVariable Long markId
    ) {
        marksService.deleteMarks(markId);
        return ResponseEntity.ok("Marks deleted successfully");
    }
}