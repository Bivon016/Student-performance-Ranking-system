package com.gradingSystem.GraadingSystem.dto;

import com.gradingSystem.GraadingSystem.model.SubjectType;
import com.gradingSystem.GraadingSystem.model.Subjects;

public class SubjectDTO {
    private Long subjectId;
    private String subjectName;
    private SubjectType subjectType;
    private String optionalGroup;   // flattened group name
    private Long subjectGroupId;    // group id for dropdowns

    public SubjectDTO(Subjects s) {
        this.subjectId     = s.getSubjectId();
        this.subjectName   = s.getSubjectName();
        this.subjectType   = s.getSubjectType();
        this.optionalGroup = s.getSubjectGroup() != null
                ? s.getSubjectGroup().getGroupName() : null;
        this.subjectGroupId = s.getSubjectGroup() != null
                ? s.getSubjectGroup().getId() : null;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public Long getSubjectGroupId() {
        return subjectGroupId;
    }

    public void setSubjectGroupId(Long subjectGroupId) {
        this.subjectGroupId = subjectGroupId;
    }

    public String getOptionalGroup() {
        return optionalGroup;
    }

    public void setOptionalGroup(String optionalGroup) {
        this.optionalGroup = optionalGroup;
    }

    public SubjectType getSubjectType() {
        return subjectType;
    }

    public void setSubjectType(SubjectType subjectType) {
        this.subjectType = subjectType;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }
}