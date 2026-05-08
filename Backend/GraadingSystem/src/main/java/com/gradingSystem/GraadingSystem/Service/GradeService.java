package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.Marksrepo;
import com.gradingSystem.GraadingSystem.Repository.StudentRepo;
import com.gradingSystem.GraadingSystem.model.Marks;
import com.gradingSystem.GraadingSystem.model.Students;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
@Service
public class GradeService {

    @Autowired
    private Marksrepo marksrepo;

    @Autowired
    private StudentRepo studentrepo;

    public Map<String, Integer> getStudentGrades(Long studentId) {

        Students student = studentrepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Marks> studentMarks = marksrepo.findByStudent(student);

        Map<String, Integer> grades = new HashMap<>();

        for (Marks mark : studentMarks) {

            int score = mark.getMarksValue();

            int points;

            if (score >= 80) {
                points = 5;
            } else if (score >= 70) {
                points = 4;
            } else if (score >= 60) {
                points = 3;
            } else if (score >= 40) {
                points = 2;
            } else {
                points = 1;
            }

            String subject = mark.getSubject().getSubjectName();

            grades.put(subject, points);
        }

        return grades;
    }
}