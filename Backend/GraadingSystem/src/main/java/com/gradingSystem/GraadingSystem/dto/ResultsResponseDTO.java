package com.gradingSystem.GraadingSystem.dto;

import java.util.List;
import java.util.Map;

public class ResultsResponseDTO {

    private List<StudentResultDTO> students;      // ranked list
    private List<String>           subjects;       // ordered subject names
    private Map<String, Double>    subjectAverages; // subjectName → average
    private double                 overallAverage;
    private boolean                hasIssues;      // true if any student has missing marks

    public ResultsResponseDTO() {}

    public ResultsResponseDTO(List<StudentResultDTO> students,
                              List<String> subjects,
                              Map<String, Double> subjectAverages,
                              double overallAverage,
                              boolean hasIssues) {
        this.students        = students;
        this.subjects        = subjects;
        this.subjectAverages = subjectAverages;
        this.overallAverage  = overallAverage;
        this.hasIssues       = hasIssues;
    }

    public List<StudentResultDTO>  getStudents()         { return students; }
    public void setStudents(List<StudentResultDTO> s)    { this.students = s; }

    public List<String>            getSubjects()         { return subjects; }
    public void setSubjects(List<String> s)              { this.subjects = s; }

    public Map<String, Double>     getSubjectAverages()  { return subjectAverages; }
    public void setSubjectAverages(Map<String, Double> a){ this.subjectAverages = a; }

    public double                  getOverallAverage()   { return overallAverage; }
    public void setOverallAverage(double o)              { this.overallAverage = o; }

    public boolean                 isHasIssues()         { return hasIssues; }
    public void setHasIssues(boolean h)                  { this.hasIssues = h; }
}