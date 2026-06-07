package com.gradingSystem.GraadingSystem.model;

import jakarta.persistence.*;

@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"student_id", "subject_id", "school_id"}
        )
)
public class StudentSubjectEnrollment {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private Students student;

    @ManyToOne
    private Subjects subject;

    @ManyToOne
    private School school;

    public StudentSubjectEnrollment(Long id, Students student, Subjects subject, School school) {
        this.id = id;
        this.student = student;
        this.subject = subject;
        this.school = school;
    }

    public StudentSubjectEnrollment() {

    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public School getSchool() {
        return school;
    }

    public void setSchool(School school) {
        this.school = school;
    }
}
