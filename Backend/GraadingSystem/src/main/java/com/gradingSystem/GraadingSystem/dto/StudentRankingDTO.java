package com.gradingSystem.GraadingSystem.dto;

public class StudentRankingDTO {
    private Long studentId;
    private String studentName;
    private int totalMarks;
    private int rank;

    public StudentRankingDTO(Long studentId, String studentName, int totalMarks, int rank) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.totalMarks = totalMarks;
        this.rank = rank;
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

    public int getRank() {
        return rank;
    }
}
