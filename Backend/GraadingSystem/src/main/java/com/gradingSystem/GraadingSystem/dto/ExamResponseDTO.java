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

    public ExamResponseDTO() {}

    public ExamResponseDTO(Long examId, ExamType examType, LocalDate examDate,
                           int form, Long subjectId, String subjectName) {
        this.examId      = examId;
        this.examType    = examType;
        this.examDate    = examDate;
        this.form        = form;
        this.subjectId   = subjectId;
        this.subjectName = subjectName;
    }

    public Long      getExamId()      { return examId; }
    public ExamType  getExamType()    { return examType; }
    public LocalDate getExamDate()    { return examDate; }
    public int       getForm()        { return form; }
    public Long      getSubjectId()   { return subjectId; }
    public String    getSubjectName() { return subjectName; }

    public void setExamId(Long examId)           { this.examId = examId; }
    public void setExamType(ExamType examType)   { this.examType = examType; }
    public void setExamDate(LocalDate examDate)  { this.examDate = examDate; }
    public void setForm(int form)                { this.form = form; }
    public void setSubjectId(Long subjectId)     { this.subjectId = subjectId; }
    public void setSubjectName(String name)      { this.subjectName = name; }
}