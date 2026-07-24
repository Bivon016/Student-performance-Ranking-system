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
    private final SchoolContextService schoolContextService;
    private final AcademicPeriodService academicPeriodService;

    public GradeService(Marksrepo marksrepo, StudentRepo studentrepo,
                        SchoolContextService schoolContextService,
                        AcademicPeriodService academicPeriodService) {
        this.marksrepo = marksrepo;
        this.studentrepo = studentrepo;
        this.schoolContextService = schoolContextService;
        this.academicPeriodService = academicPeriodService;
    }

    public Map<String, Double> getStudentGrades(Long studentId, Long periodId) {
        School school = schoolContextService.getCurrentSchool();
        Students student = studentrepo.findByIdAndSchool(studentId, school)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Long resolvedPeriodId = academicPeriodService.resolvePeriod(periodId).getId();
        List<Marks> studentMarks = marksrepo.findByStudent(student).stream()
                .filter(m -> m.getExam().getAcademicPeriod().getId().equals(resolvedPeriodId))
                .toList();

        Map<String, Double> grades = new HashMap<>();

        for (Marks mark : studentMarks) {

            int score = mark.getMarksValue();
            double points;

            if (score >= 90) {
                points = 8.0;
            } else if (score >= 80) {
                points = 7.0;
            } else if (score >= 70) {
                points = 6.0;
            } else if (score >= 60) {
                points = 5.0;
            } else if (score >= 50) {
                points = 4.0;
            } else if (score >= 40) {
                points = 3.0;
            } else if (score >= 30) {
                points = 2.0;
            } else if (score >= 0) {
                points = 1.0;
            } else {
                points = 0.0;
            }

            String subject = mark.getSubject().getSubjectName();

            grades.put(subject, points);
        }

        return grades;
    }
}