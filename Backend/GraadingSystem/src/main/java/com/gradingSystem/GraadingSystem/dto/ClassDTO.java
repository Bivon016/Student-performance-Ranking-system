package com.gradingSystem.GraadingSystem.dto;

public class ClassDTO {

    private Long    classId;
    private String  className;
    private Integer formNumber;
    private String  stream;
    private Integer year;


    public ClassDTO(Long classId, String className, Integer formNumber, String stream, Integer year) {
        this.classId    = classId;
        this.className  = className != null ? className : "Form " + formNumber + " " + stream + " - " + year;
        this.formNumber = formNumber;
        this.stream     = stream;
        this.year       = year;
    }

    public Long    getClassId()                  { return classId; }
    public void    setClassId(Long classId)      { this.classId = classId; }

    public String  getClassName()                { return className; }
    public void    setClassName(String className){ this.className = className; }

    public Integer getFormNumber()               { return formNumber; }
    public void    setFormNumber(Integer f)      { this.formNumber = f; }

    public String  getStream()                   { return stream; }
    public void    setStream(String stream)      { this.stream = stream; }

    public Integer getYear()                     { return year; }
    public void    setYear(Integer year)         { this.year = year; }
}