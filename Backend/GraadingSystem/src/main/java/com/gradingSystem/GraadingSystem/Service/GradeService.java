package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.Marksrepo;
import com.gradingSystem.GraadingSystem.Repository.StudentRepo;
import com.gradingSystem.GraadingSystem.model.Marks;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.Students;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
@Service
public class GradeService {
    private final Marksrepo marksrepo;
    private final StudentRepo studentrepo;
    private final SchoolContextService  schoolContextService;

    public GradeService(Marksrepo marksrepo, StudentRepo studentrepo, SchoolContextService schoolContextService) {
        this.marksrepo = marksrepo;
        this.studentrepo = studentrepo;
        this.schoolContextService = schoolContextService;
    }

    public Map<String, Double> getStudentGrades(Long studentId){
        School school = schoolContextService.getCurrentSchool();
        Students student = studentrepo.findByIdAndSchool(studentId,school)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Marks> studentMarks = marksrepo.findByStudent(student);

        Map<String, Double> grades = new HashMap<>();

        for (Marks mark : studentMarks) {

            int score = mark.getMarksValue();
            double points;

            if (score >= 90) {
                points = 4.0;
            } else if (score >= 75) {
                points = 3.5;
            } else if (score >= 58) {
                points = 3.0;
            } else if (score >= 41) {
                points = 2.5;
            } else if (score >= 31) {
                points = 2.0;
            } else if (score >= 21) {
                points = 1.5;
            } else if (score >= 11) {
                points = 1.0;
            } else if (score >= 1) {
                points = 0.5;
            } else {
                points = 0.0;
            }

            String subject = mark.getSubject().getSubjectName();

            grades.put(subject, points);
        }

        return grades;
    }
}