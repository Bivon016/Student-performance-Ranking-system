package com.gradingSystem.GraadingSystem.dataStructures;

import com.gradingSystem.GraadingSystem.dto.StudentResultDTO;

public class StudentRankNode {
    private StudentResultDTO resultDTO;
    private double totalMarks;

    public StudentRankNode(StudentResultDTO resultDTO) {
        this.resultDTO  = resultDTO;
        this.totalMarks = resultDTO.getTotalMarks();
    }

    public double          getTotalMarks() { return totalMarks; }
    public StudentResultDTO getResultDTO() { return resultDTO; }
}