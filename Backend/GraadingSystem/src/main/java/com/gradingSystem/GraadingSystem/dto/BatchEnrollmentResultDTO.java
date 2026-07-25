// BatchEnrollmentResultDTO.java
package com.gradingSystem.GraadingSystem.dto;

import java.util.List;

/**
 * Response returned after a batch enrollment operation
 * (many students enrolled into many subjects at once).
 *
 * enrolledCount: number of new student-subject enrollments actually created
 * skipped:       human-readable reasons for entries that were NOT enrolled
 *                (e.g. "John Mwangi already in Mathematics")
 */
public class BatchEnrollmentResultDTO {

    private int enrolledCount;
    private List<String> skipped;

    public BatchEnrollmentResultDTO() {}

    public BatchEnrollmentResultDTO(int enrolledCount, List<String> skipped) {
        this.enrolledCount = enrolledCount;
        this.skipped = skipped;
    }

    public int getEnrolledCount() { return enrolledCount; }
    public void setEnrolledCount(int enrolledCount) { this.enrolledCount = enrolledCount; }

    public List<String> getSkipped() { return skipped; }
    public void setSkipped(List<String> skipped) { this.skipped = skipped; }
}