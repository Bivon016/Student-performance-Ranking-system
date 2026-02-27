package com.gradingSystem.GraadingSystem.dto;

import java.util.List;

public class MarksBatchRequest {

    private Long subjectId;
    private Long examId;        // ← NEW: which exam these marks belong to

    private List<StudentMarks> marks;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getSubjectId()             { return subjectId; }
    public void setSubjectId(Long id)      { this.subjectId = id; }

    public Long getExamId()                { return examId; }
    public void setExamId(Long examId)     { this.examId = examId; }

    public List<StudentMarks> getMarks()          { return marks; }
    public void setMarks(List<StudentMarks> marks){ this.marks = marks; }

    // ── Inner class ───────────────────────────────────────────────────────────

    public static class StudentMarks {
        private Long studentId;
        private int  marksValue;

        public Long getStudentId()           { return studentId; }
        public void setStudentId(Long id)    { this.studentId = id; }

        public int  getMarksValue()          { return marksValue; }
        public void setMarksValue(int v)     { this.marksValue = v; }
    }
}