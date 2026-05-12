package com.gradingSystem.GraadingSystem.model;

import jakarta.persistence.*;

@Entity
@Table(name = "teacher_assignments")
public class TeacherAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teachers teacher;

    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    private Subjects subject;

    @ManyToOne
    @JoinColumn(name = "class_id", nullable = false)
    private Classes assignedClass;

    public Long getId() { return id; }

    public Teachers getTeacher() { return teacher; }
    public void setTeacher(Teachers teacher) { this.teacher = teacher; }

    public Subjects getSubject() { return subject; }
    public void setSubject(Subjects subject) { this.subject = subject; }

    public Classes getAssignedClass() { return assignedClass; }
    public void setAssignedClass(Classes assignedClass) { this.assignedClass = assignedClass; }
}