package com.gradingSystem.GraadingSystem.model;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Entity
@Table(name = "subjects")
public class Subjects {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subject_id")
    private Long subjectId;

    @Column(name = "subject_name", nullable = false, length = 20)
    private String subjectName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;


    public Subjects(Long subjectId, String subjectName, School school) {
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.school = school;
    }

    public Long getSubjectId() {

        return subjectId;
    }

    public School getSchool() {
        return school;
    }

    public void setSchool(School school) {
        this.school = school;
    }

    public void setSubjectId(Long subjectId) {

        this.subjectId = subjectId;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

}
