package com.gradingSystem.GraadingSystem.dto;

import com.gradingSystem.GraadingSystem.model.ExamType;
import java.time.LocalDate;

public class ExamResponseDTO {

    private Long      examId;
    private ExamType  examType;
    private LocalDate examDate;
    private int       form;
    private Long      subjectId;
    private String    subjectName;
    private Long   periodId;
    private int    periodYear;
    private int    periodTerm;
    private Long classId;
    public ExamResponseDTO() {}

    public ExamResponseDTO(Long examId, ExamType examType, LocalDate examDate,
                           int form, Long subjectId, String subjectName,Long periodId,int periodYear,int periodTerm,Long classId) {
        this.examId      = examId;
        this.examType    = examType;
        this.examDate    = examDate;
        this.form        = form;
        this.subjectId   = subjectId;
        this.subjectName = subjectName;
        this.periodId   = periodId;
        this.periodYear = periodYear;
        this.periodTerm = periodTerm;
        this.classId      = classId;
    }

    public Long getClassId() {
        return classId;
    }

    public void setClassId(Long classId) {
        this.classId = classId;
    }

    public Long      getExamId()      { return examId; }
    public ExamType  getExamType()    { return examType; }
    public LocalDate getExamDate()    { return examDate; }
    public int       getForm()        { return form; }
    public Long      getSubjectId()   { return subjectId; }

    public Long getPeriodId() {
        return periodId;
    }

    public void setPeriodId(Long periodId) {
        this.periodId = periodId;
    }

    public int getPeriodYear() {
        return periodYear;
    }

    public void setPeriodYear(int periodYear) {
        this.periodYear = periodYear;
    }

    public int getPeriodTerm() {
        return periodTerm;
    }

    public void setPeriodTerm(int periodTerm) {
        this.periodTerm = periodTerm;
    }

    public String    getSubjectName() { return subjectName; }

    public void setExamId(Long examId)           { this.examId = examId; }
    public void setExamType(ExamType examType)   { this.examType = examType; }
    public void setExamDate(LocalDate examDate)  { this.examDate = examDate; }
    public void setForm(int form)                { this.form = form; }
    public void setSubjectId(Long subjectId)     { this.subjectId = subjectId; }
    public void setSubjectName(String name)      { this.subjectName = name; }
}