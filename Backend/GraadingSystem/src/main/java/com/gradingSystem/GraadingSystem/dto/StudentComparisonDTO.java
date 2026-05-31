package com.gradingSystem.GraadingSystem.dto;

public class StudentComparisonDTO {
    private Long   studentId;
    private String studentName;
    private int    currentMarks;
    private Integer previousMarks;
    private Integer change;

    public StudentComparisonDTO(Long studentId, String studentName,
                                int currentMarks, Integer previousMarks,
                                Integer change) {
        this.studentId     = studentId;
        this.studentName   = studentName;
        this.currentMarks  = currentMarks;
        this.previousMarks = previousMarks;
        this.change        = change;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public int getCurrentMarks() {
        return currentMarks;
    }

    public void setCurrentMarks(int currentMarks) {
        this.currentMarks = currentMarks;
    }

    public Integer getPreviousMarks() {
        return previousMarks;
    }

    public void setPreviousMarks(Integer previousMarks) {
        this.previousMarks = previousMarks;
    }



    public Integer getChange() {
        return change;
    }

    public void setChange(Integer change) {
        this.change = change;
    }
}