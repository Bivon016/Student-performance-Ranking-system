package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.EnrollmentService;
import com.gradingSystem.GraadingSystem.dto.BatchEnrollSubjectsDTO;
import com.gradingSystem.GraadingSystem.dto.BatchEnrollmentResultDTO;
import com.gradingSystem.GraadingSystem.dto.BulkEnrollmentRequestDTO;
import com.gradingSystem.GraadingSystem.dto.EnrollmentResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/enrollment")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }


    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    @PostMapping("/bulk")
    public ResponseEntity<EnrollmentResponseDTO> bulkEnroll(
            @RequestBody BulkEnrollmentRequestDTO request) {
        return ResponseEntity.ok(enrollmentService.enrollStudent(request));
    }

    /**
     * GET /api/enrollment/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<EnrollmentResponseDTO> getEnrollment(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(enrollmentService.getStudentEnrollment(studentId));
    }

    /**
     * DELETE /api/enrollment/student/{studentId}/subject/{subjectId}
     * For changing an optional subject after initial enrollment.
     */
    @DeleteMapping("/student/{studentId}/subject/{subjectId}")
    public ResponseEntity<Void> removeSubject(
            @PathVariable Long studentId,
            @PathVariable Long subjectId) {
        enrollmentService.removeSubjectFromStudent(studentId, subjectId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
    @PostMapping("/batch")
    public ResponseEntity<BatchEnrollmentResultDTO> batchEnroll(@RequestBody BatchEnrollSubjectsDTO request) {
        return ResponseEntity.ok(enrollmentService.batchEnrollSubjects(request));
    }


}