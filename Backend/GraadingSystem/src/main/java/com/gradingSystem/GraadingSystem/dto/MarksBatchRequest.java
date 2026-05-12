package com.gradingSystem.GraadingSystem.dto;

import java.util.List;

public class MarksBatchRequest {

    private Long subjectId;
    private Long examId;
    private Long classId;          // ✅ ADD THIS

    private List<StudentMarks> marks;

    public Long getSubjectId()              { return subjectId; }
    public void setSubjectId(Long id)       { this.subjectId = id; }

    public Long getExamId()                 { return examId; }
    public void setExamId(Long examId)      { this.examId = examId; }

    public Long getClassId()                { return classId; }   // ✅ ADD
    public void setClassId(Long classId)    { this.classId = classId; } // ✅ ADD

    public List<StudentMarks> getMarks()            { return marks; }
    public void setMarks(List<StudentMarks> marks)  { this.marks = marks; }

    public static class StudentMarks {
        private Long studentId;
        private int  marksValue;

        public Long getStudentId()           { return studentId; }
        public void setStudentId(Long id)    { this.studentId = id; }

        public int  getMarksValue()          { return marksValue; }
        public void setMarksValue(int v)     { this.marksValue = v; }
    }
}