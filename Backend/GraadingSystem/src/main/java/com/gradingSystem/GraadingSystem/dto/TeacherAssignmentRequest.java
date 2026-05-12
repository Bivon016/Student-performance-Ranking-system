package com.gradingSystem.GraadingSystem.dto;

public class TeacherAssignmentRequest {
    private Long subjectId;
    private Long classId;

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }
}