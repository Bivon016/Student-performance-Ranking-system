package com.gradingSystem.GraadingSystem.dto;

import com.gradingSystem.GraadingSystem.model.ExamType;
import java.time.LocalDate;

public class MarksResponseDTO {

    private Long      marksId;
    private int       marksValue;
    private Long      studentId;
    private String    studentName;
    private Long      subjectId;
    private String    subjectName;

    private int gradePoint;

    // ── NEW exam fields ───────────────────────────────────────────────────────
    private Long      examId;
    private ExamType  examType;
    private LocalDate examDate;

    public int getGradePoint() {
        return gradePoint;
    }

    public void setGradePoint(int gradePoint) {
        this.gradePoint = gradePoint;
    }

    private int       form;

    public MarksResponseDTO() {}

    public MarksResponseDTO(Long marksId, int marksValue,
                            Long studentId, String studentName,
                            Long subjectId, String subjectName,
                            Long examId, ExamType examType,
                            LocalDate examDate, int form) {
        this.marksId     = marksId;
        this.marksValue  = marksValue;
        this.studentId   = studentId;
        this.studentName = studentName;
        this.subjectId   = subjectId;
        this.subjectName = subjectName;
        this.examId      = examId;
        this.examType    = examType;
        this.examDate    = examDate;
        this.form        = form;
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public Long      getMarksId()     { return marksId; }
    public int       getMarksValue()  { return marksValue; }
    public Long      getStudentId()   { return studentId; }
    public String    getStudentName() { return studentName; }
    public Long      getSubjectId()   { return subjectId; }
    public String    getSubjectName() { return subjectName; }
    public Long      getExamId()      { return examId; }
    public ExamType  getExamType()    { return examType; }
    public LocalDate getExamDate()    { return examDate; }
    public int       getForm()        { return form; }

    // ── Setters ───────────────────────────────────────────────────────────────

    public void setMarksId(Long marksId)         { this.marksId = marksId; }
    public void setMarksValue(int marksValue)    { this.marksValue = marksValue; }
    public void setStudentId(Long studentId)     { this.studentId = studentId; }
    public void setStudentName(String name)      { this.studentName = name; }
    public void setSubjectId(Long subjectId)     { this.subjectId = subjectId; }
    public void setSubjectName(String name)      { this.subjectName = name; }
    public void setExamId(Long examId)           { this.examId = examId; }
    public void setExamType(ExamType examType)   { this.examType = examType; }
    public void setExamDate(LocalDate examDate)  { this.examDate = examDate; }
    public void setForm(int form)                { this.form = form; }
}