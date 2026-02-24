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

    // ✅ Explicit default constructor required by Hibernate
    public Marks() {
    }

    // Constructor for service / convenience
    public Marks(int marksValue, Students student, Subjects subject) {
        this.marksValue = marksValue;
        this.student = student;
        this.subject = subject;
    }

    // Getters and setters
    public Long getMarksId() {
        return marksId;
    }

    public void setMarksId(Long marksId) {
        this.marksId = marksId;
    }

    public int getMarksValue() {
        return marksValue;
    }

    public void setMarksValue(int marksValue) {
        this.marksValue = marksValue;
    }

    public Students getStudent() {
        return student;
    }

    public void setStudent(Students student) {
        this.student = student;
    }

    public Subjects getSubject() {
        return subject;
    }

    public void setSubject(Subjects subject) {
        this.subject = subject;
    }
}