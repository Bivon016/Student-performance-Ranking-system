package com.gradingSystem.GraadingSystem.dto;

import java.util.List;

public class ClassSubjectRankingDTO {

    private Long   classId;
    private String className;
    private List<SubjectClassStatsDTO> subjects; // sorted by rank ascending (1 = highest mean)

    public ClassSubjectRankingDTO() {}

    public ClassSubjectRankingDTO(Long classId, String className, List<SubjectClassStatsDTO> subjects) {
        this.classId   = classId;
        this.className = className;
        this.subjects  = subjects;
    }

    public Long getClassId()                                { return classId; }
    public void setClassId(Long classId)                     { this.classId = classId; }

    public String getClassName()                             { return className; }
    public void setClassName(String className)               { this.className = className; }

    public List<SubjectClassStatsDTO> getSubjects()          { return subjects; }
    public void setSubjects(List<SubjectClassStatsDTO> subs) { this.subjects = subs; }
}
