package com.gradingSystem.GraadingSystem.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;



import java.util.ArrayList;
import java.util.List;

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
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private School school;

    // Subjects.java
    @OneToMany(mappedBy = "subject", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Exam> exams = new ArrayList<>();

    @Column(name = "subjectType")
    private SubjectType subjectType;

    @ManyToOne
    @JoinColumn(name = "subject_group_id")
    private SubjectGroup subjectGroup;



    public Subjects(Long subjectId, String subjectName, School school,SubjectType subjectType, SubjectGroup subjectGroup) {
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.school = school;
        this.subjectType = subjectType;
        this.subjectGroup = subjectGroup;
    }

    // getters & setters

    public void setSubjectType(SubjectType subjectType) {
        this.subjectType = subjectType;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public SubjectType getSubjectType() {
        return subjectType;
    }


    public SubjectGroup getSubjectGroup() {
        return subjectGroup;
    }

    public void setSubjectGroup(SubjectGroup subjectGroup) {
        this.subjectGroup = subjectGroup;
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

    public School getSchool() {

        return school;
    }

    public void setSchool(School school) {

        this.school = school;
    }

    public List<Exam> getExams() {

        return exams;
    }

    public void setExams(List<Exam> exams) {

        this.exams = exams;
    }
}