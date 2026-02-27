package com.gradingSystem.GraadingSystem.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "exams")
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exam_id")
    private Long examId;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false)
    private ExamType examType;

    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @Column(name = "form", nullable = false)
    private int form;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", referencedColumnName = "subject_id", nullable = false)
    private Subjects subject;

    // ── Constructors ──────────────────────────────────────────────────────────

    public Exam() {}

    public Exam(ExamType examType, LocalDate examDate, int form, Subjects subject) {
        this.examType = examType;
        this.examDate = examDate;
        this.form     = form;
        this.subject  = subject;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getExamId()                    { return examId; }
    public void setExamId(Long examId)         { this.examId = examId; }

    public ExamType getExamType()              { return examType; }
    public void setExamType(ExamType examType) { this.examType = examType; }

    public LocalDate getExamDate()             { return examDate; }
    public void setExamDate(LocalDate examDate){ this.examDate = examDate; }

    public int getForm()                       { return form; }
    public void setForm(int form)              { this.form = form; }

    public Subjects getSubject()               { return subject; }
    public void setSubject(Subjects subject)   { this.subject = subject; }
}