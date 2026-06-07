// EnrollmentResponseDTO.java
package com.gradingSystem.GraadingSystem.dto;

import java.util.List;

public class EnrollmentResponseDTO {

    private Long   studentId;
    private String studentName;
    private List<SubjectSummaryDTO> enrolledSubjects;
    private List<String> warnings; // e.g. if a group count rule was violated

    public EnrollmentResponseDTO() {}

    public EnrollmentResponseDTO(Long studentId, String studentName,
                                 List<SubjectSummaryDTO> enrolledSubjects,
                                 List<String> warnings) {
        this.studentId       = studentId;
        this.studentName     = studentName;
        this.enrolledSubjects = enrolledSubjects;
        this.warnings        = warnings;
    }

    public Long   getStudentId()       { return studentId; }
    public String getStudentName()     { return studentName; }
    public List<SubjectSummaryDTO> getEnrolledSubjects() { return enrolledSubjects; }
    public List<String> getWarnings()  { return warnings; }

    public void setStudentId(Long studentId)                             { this.studentId = studentId; }
    public void setStudentName(String studentName)                       { this.studentName = studentName; }
    public void setEnrolledSubjects(List<SubjectSummaryDTO> enrolledSubjects) { this.enrolledSubjects = enrolledSubjects; }
    public void setWarnings(List<String> warnings)                       { this.warnings = warnings; }
}