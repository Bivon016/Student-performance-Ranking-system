package com.gradingSystem.GraadingSystem.dto;

public class AssignmentDTO {
    private Long id;  // ✅ add this
    private Long subjectId;
    private String subjectName;
    private Long classId;
    private String className;

    public AssignmentDTO(Long id, Long subjectId, String subjectName, Long classId, String className) {
        this.id = id;
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.classId = classId;
        this.className = className;
    }

    public Long getId() { return id; }
    public Long getSubjectId() { return subjectId; }
    public String getSubjectName() { return subjectName; }
    public Long getClassId() { return classId; }
    public String getClassName() { return className; }
}