// BulkEnrollmentRequestDTO.java
package com.gradingSystem.GraadingSystem.dto;

import java.util.List;
import java.util.Map;

/**
 * Sent by the principal when admitting/updating a student's subject choices.
 *
 * optionalSubjectsByGroup:  groupName → list of chosen subjectIds
 *   e.g. { "Group A": [3, 7], "Group B": [12] }
 *
 * Compulsory subjects are resolved automatically — no need to include them here.
 */
public class BulkEnrollmentRequestDTO {

    private Long studentId;

    /** groupName → list of selected subjectIds from that group */
    private Map<String, List<Long>> optionalSubjectsByGroup;

    public BulkEnrollmentRequestDTO() {}

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Map<String, List<Long>> getOptionalSubjectsByGroup() { return optionalSubjectsByGroup; }
    public void setOptionalSubjectsByGroup(Map<String, List<Long>> optionalSubjectsByGroup) {
        this.optionalSubjectsByGroup = optionalSubjectsByGroup;
    }
}