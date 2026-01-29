package com.gradingSystem.GraadingSystem.dataStructures;

public class StudentRankNode {
    private Long studentId;
    private String studentName;
    private int totalMarks;

    public StudentRankNode(Long studentId, String studentName, int totalMarks) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.totalMarks = totalMarks;
    }

    public Long getStudentId() {
        return studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public int getTotalMarks() {
        return totalMarks;
    }
}
