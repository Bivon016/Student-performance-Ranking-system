package com.gradingSystem.GraadingSystem.dto;

import java.util.List;
import java.util.Map;

public class StudentResultDTO {

    private Long              studentId;
    private String            studentName;
    private Long              classId;
    private String            className;

    // subjectName → summed/averaged marks value (null if missing)
    private Map<String, Double> subjectMarks;

    // list of subject names where marks are missing
    private List<String>      missingSubjects;

    private double            totalMarks;
    private double            totalPoints;
    private int               rank;
    private boolean           hasIssues;   // true if any subject marks are missing

    public StudentResultDTO() {}

    public StudentResultDTO(Long studentId, String studentName, Long classId, String className,
                            Map<String, Double> subjectMarks, List<String> missingSubjects,
                            double totalMarks, int rank) {
        this.studentId       = studentId;
        this.studentName     = studentName;
        this.classId         = classId;
        this.className       = className;
        this.subjectMarks    = subjectMarks;
        this.missingSubjects = missingSubjects;
        this.totalMarks      = totalMarks;
        this.rank            = rank;
        this.hasIssues       = !missingSubjects.isEmpty();
    }

    public Long              getStudentId()                    { return studentId; }
    public void              setStudentId(Long id)             { this.studentId = id; }

    public String            getStudentName()                  { return studentName; }
    public void              setStudentName(String n)          { this.studentName = n; }

    public Long              getClassId()                      { return classId; }
    public void              setClassId(Long c)                { this.classId = c; }

    public String            getClassName()                    { return className; }
    public void              setClassName(String c)            { this.className = c; }

    public Map<String,Double> getSubjectMarks()                { return subjectMarks; }
    public void              setSubjectMarks(Map<String,Double> m) { this.subjectMarks = m; }

    public List<String>      getMissingSubjects()              { return missingSubjects; }
    public void              setMissingSubjects(List<String> m){ this.missingSubjects = m; }

    public double            getTotalMarks()                   { return totalMarks; }
    public void              setTotalMarks(double t)           { this.totalMarks = t; }

    // Sum of per-subject grade points (8-point scale) — this is what ranking is now based on
    public double            getTotalPoints()                  { return totalPoints; }
    public void              setTotalPoints(double p)          { this.totalPoints = p; }

    public int               getRank()                         { return rank; }
    public void              setRank(int r)                    { this.rank = r; }

    public boolean           isHasIssues()                     { return hasIssues; }
    public void              setHasIssues(boolean h)           { this.hasIssues = h; }
}