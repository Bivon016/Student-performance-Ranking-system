package com.gradingSystem.GraadingSystem.dto;

import java.util.List;

public class SubjectRankingResponseDTO {

    private List<ClassSubjectRankingDTO> classResults;
    private Long periodId;
    private int  periodYear;
    private int  periodTerm;

    public SubjectRankingResponseDTO() {}

    public SubjectRankingResponseDTO(List<ClassSubjectRankingDTO> classResults,
                                      Long periodId, int periodYear, int periodTerm) {
        this.classResults = classResults;
        this.periodId     = periodId;
        this.periodYear   = periodYear;
        this.periodTerm   = periodTerm;
    }

    public List<ClassSubjectRankingDTO> getClassResults()           { return classResults; }
    public void setClassResults(List<ClassSubjectRankingDTO> c)     { this.classResults = c; }

    public Long getPeriodId()               { return periodId; }
    public void setPeriodId(Long periodId)  { this.periodId = periodId; }

    public int getPeriodYear()              { return periodYear; }
    public void setPeriodYear(int y)        { this.periodYear = y; }

    public int getPeriodTerm()              { return periodTerm; }
    public void setPeriodTerm(int t)        { this.periodTerm = t; }
}
