package com.gradingSystem.GraadingSystem.dto;

public class SubjectClassStatsDTO {

    private String subjectName;
    private double mean;
    private int    studentCount;
    private int    rank; // 1 = highest mean within the class

    // Comparison to the previous academic period (same class, same subject).
    // Null when there's no earlier period on record, or the subject had no
    // recorded marks last term.
    private Double previousMean;
    private Double deviation; // mean - previousMean

    public SubjectClassStatsDTO() {}

    public SubjectClassStatsDTO(String subjectName, double mean, int studentCount, int rank,
                                 Double previousMean, Double deviation) {
        this.subjectName   = subjectName;
        this.mean           = mean;
        this.studentCount   = studentCount;
        this.rank           = rank;
        this.previousMean   = previousMean;
        this.deviation      = deviation;
    }

    public String getSubjectName()               { return subjectName; }
    public void setSubjectName(String subjectName){ this.subjectName = subjectName; }

    public double getMean()                       { return mean; }
    public void setMean(double mean)              { this.mean = mean; }

    public int getStudentCount()                  { return studentCount; }
    public void setStudentCount(int studentCount) { this.studentCount = studentCount; }

    public int getRank()                          { return rank; }
    public void setRank(int rank)                 { this.rank = rank; }

    public Double getPreviousMean()               { return previousMean; }
    public void setPreviousMean(Double previousMean) { this.previousMean = previousMean; }

    public Double getDeviation()                  { return deviation; }
    public void setDeviation(Double deviation)    { this.deviation = deviation; }
}
