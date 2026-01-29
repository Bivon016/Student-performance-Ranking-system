package com.gradingSystem.GraadingSystem.dto;

import java.util.List;

public class MarksBatchRequest {

    private Long subjectId;
    private List<StudentMarks> marks;

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public List<StudentMarks> getMarks() {
        return marks;
    }

    public void setMarks(List<StudentMarks> marks) {
        this.marks = marks;
    }

    // Inner DTO
    public static class StudentMarks {
        private Long studentId;
        private int marksValue;

        public Long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }

        public int getMarksValue() {
            return marksValue;
        }

        public void setMarksValue(int marksValue) {
            this.marksValue = marksValue;
        }
    }
}
