package com.gradingSystem.GraadingSystem.model;

import jakarta.persistence.*;

@Entity
@Table(name = "Classes")
public class Classes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long classId;

    @Column(name = "class_name")
    private String className;

    @Column(nullable = false)
    private Integer formNumber;

    @Column(nullable = false)
    private String stream;

    @Column(nullable = false)
    private Integer year;

    public Classes() {}

    public Classes(Integer formNumber, String stream, Integer year, String className) {
        this.formNumber = formNumber;
        this.stream     = stream;
        this.year       = year;
        this.className  = className;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getClassId()                     { return classId; }
    public void setClassId(Long classId)         { this.classId = classId; }

    public String getClassName()                 { return className; }
    public void setClassName(String className)   { this.className = className; }

    public Integer getFormNumber()               { return formNumber; }
    public void setFormNumber(Integer formNumber){ this.formNumber = formNumber; }

    public String getStream()                    { return stream; }
    public void setStream(String stream)         { this.stream = stream; }

    public Integer getYear()                     { return year; }
    public void setYear(Integer year)            { this.year = year; }
}