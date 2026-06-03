package com.gradingSystem.GraadingSystem.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.yaml.snakeyaml.error.Mark;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exams")
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exam_id")
    private Long examId;

    private Long classId;

    public Long getClassId() {
        return classId;
    }

    public void setClassId(Long classId) {
        this.classId = classId;
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false)
    private ExamType examType;

    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @Column(name = "form", nullable = false)
    private int form;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", referencedColumnName = "subject_id", nullable = false)
    @JsonIgnoreProperties({"exams", "school", "hibernateLazyInitializer", "handler"}) // ← stops subject from re-serializing exams
    private Subjects subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private School school;

    @OneToMany(
            mappedBy = "exam",        // ✅ matches "private Exam exam" in Marks.java
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnoreProperties({"exam", "hibernateLazyInitializer", "handler"})
    private List<Marks> marks = new ArrayList<>();

    public List<Marks> getMarks() { return marks; }
    public void setMarks(List<Marks> marks) { this.marks = marks; }


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_period_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private AcademicPeriod academicPeriod;

    // ── Constructors ──────────────────────────────────────────────────────────

    public Exam() {}

    public Exam(ExamType examType, LocalDate examDate, int form, Subjects subject, AcademicPeriod academicPeriod,Long classId,School school) {
        this.examType = examType;
        this.examDate = examDate;
        this.form     = form;
        this.subject  = subject;
        this.academicPeriod = academicPeriod;
        this.classId = classId;
        this.school = school;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public AcademicPeriod getAcademicPeriod() {
        return academicPeriod;
    }

    public School getSchool() {
        return school;
    }

    public void setSchool(School school) {
        this.school = school;
    }

    public void setAcademicPeriod(AcademicPeriod academicPeriod) {
        this.academicPeriod = academicPeriod;
    }

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