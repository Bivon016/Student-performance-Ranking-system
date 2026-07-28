package com.gradingSystem.GraadingSystem.dataStructures;

import com.gradingSystem.GraadingSystem.dto.StudentResultDTO;

public class StudentRankNode {
    private StudentResultDTO resultDTO;
    private double totalPoints;

    public StudentRankNode(StudentResultDTO resultDTO) {
        this.resultDTO   = resultDTO;
        this.totalPoints = resultDTO.getTotalPoints();
    }

    public double           getTotalPoints() { return totalPoints; }
    public StudentResultDTO getResultDTO()   { return resultDTO; }
}