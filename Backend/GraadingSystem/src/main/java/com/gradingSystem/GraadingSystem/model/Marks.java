package com.gradingSystem.GraadingSystem.model;

import jakarta.persistence.*;

@Entity
@Table(name = "marks")
public class Marks {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "marksId", nullable = false)
    private Long marksId;

    @Column(name = "marks_value", nullable = false)
    private int marksValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", referencedColumnName = "id", nullable = false)
    private Students student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", referencedColumnName = "subject_id", nullable = false)
    private Subjects subject;

    // ── NEW: link to Exam ─────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", referencedColumnName = "exam_id", nullable = false)
    private Exam exam;

    // ── Constructors ──────────────────────────────────────────────────────────

    public Marks() {}

    public Marks(int marksValue, Students student, Subjects subject, Exam exam) {
        this.marksValue = marksValue;
        this.student    = student;
        this.subject    = subject;
        this.exam       = exam;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getMarksId()               { return marksId; }
    public void setMarksId(Long marksId)   { this.marksId = marksId; }

    public int getMarksValue()             { return marksValue; }
    public void setMarksValue(int v)       { this.marksValue = v; }

    public Students getStudent()           { return student; }
    public void setStudent(Students s)     { this.student = s; }

    public Subjects getSubject()           { return subject; }
    public void setSubject(Subjects s)     { this.subject = s; }

    public Exam getExam()                  { return exam; }
    public void setExam(Exam exam)         { this.exam = exam; }
}