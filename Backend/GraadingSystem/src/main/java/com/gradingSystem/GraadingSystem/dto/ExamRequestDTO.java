package com.gradingSystem.GraadingSystem.dto;

import com.gradingSystem.GraadingSystem.model.ExamType;
import java.time.LocalDate;

public class ExamRequestDTO {

    private ExamType  examType;
    private LocalDate examDate;
    private int       form;
    private Long      subjectId;
    private Long      classId;       // ✅ ADD THIS

    public ExamRequestDTO() {}

    public ExamType  getExamType()            { return examType; }
    public void setExamType(ExamType t)       { this.examType = t; }

    public LocalDate getExamDate()            { return examDate; }
    public void setExamDate(LocalDate d)      { this.examDate = d; }

    public int  getForm()                     { return form; }
    public void setForm(int form)             { this.form = form; }

    public Long getSubjectId()                { return subjectId; }
    public void setSubjectId(Long subjectId)  { this.subjectId = subjectId; }

    public Long getClassId()                  { return classId; }  // ✅ ADD
    public void setClassId(Long classId)      { this.classId = classId; } // ✅ ADD
}