// SubjectSummaryDTO.java
package com.gradingSystem.GraadingSystem.dto;

import com.gradingSystem.GraadingSystem.model.SubjectType;

public class SubjectSummaryDTO {
    private Long        subjectId;
    private String      subjectName;
    private SubjectType subjectType;
    private String      optionalGroup; // null for compulsory



    public SubjectSummaryDTO() {}

    public SubjectSummaryDTO(Long subjectId, String subjectName,
                             SubjectType subjectType, String optionalGroup) {
        this.subjectId     = subjectId;
        this.subjectName   = subjectName;
        this.subjectType   = subjectType;
        this.optionalGroup = optionalGroup;
    }

    public Long        getSubjectId()     { return subjectId; }
    public String      getSubjectName()   { return subjectName; }
    public SubjectType getSubjectType()   { return subjectType; }
    public String      getOptionalGroup() { return optionalGroup; }

    public void setSubjectId(Long subjectId)         { this.subjectId = subjectId; }
    public void setSubjectName(String subjectName)   { this.subjectName = subjectName; }
    public void setSubjectType(SubjectType t)        { this.subjectType = t; }
    public void setOptionalGroup(String optionalGroup){ this.optionalGroup = optionalGroup; }
}