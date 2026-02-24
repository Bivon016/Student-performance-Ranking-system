package com.gradingSystem.GraadingSystem.dto;

public class MarksResponseDTO {

    private Long marksId;
    private int marksValue;

    private Long studentId;
    private String studentName;

    private Long subjectId;
    private String subjectName;

    public MarksResponseDTO(
            Long marksId,
            int marksValue,
            Long studentId,
            String studentName,
            Long subjectId,
            String subjectName
    ) {
        this.marksId = marksId;
        this.marksValue = marksValue;
        this.studentId = studentId;
        this.studentName = studentName;
        this.subjectId = subjectId;
        this.subjectName = subjectName;
    }

    public Long getMarksId() { return marksId; }
    public int getMarksValue() { return marksValue; }
    public Long getStudentId() { return studentId; }
    public String getStudentName() { return studentName; }
    public Long getSubjectId() { return subjectId; }
    public String getSubjectName() { return subjectName; }
}