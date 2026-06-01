package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Exam;
import com.gradingSystem.GraadingSystem.model.ExamType;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface ExamRepo extends JpaRepository<Exam, Long> {

    // All exams for a given subject + form  (used by the "Add Marks" step filter)
    List<Exam> findBySubjectAndForm(Subjects subject, int form);

    // All exams for a subject  (used in view/reporting)
    List<Exam> findBySubject(Subjects subject);

    // All exams for a form  (cross-subject view)
    List<Exam> findByForm(int form);

    // Fetch all exams matching a set of form numbers and an exam type
    @Query("SELECT e FROM Exam e JOIN FETCH e.subject WHERE e.form IN :forms AND e.examType = :examType")
    List<Exam> findByFormInAndExamType(@Param("forms") Set<Integer> forms,
                                       @Param("examType") ExamType examType);
    List<Exam> findBySubjectAndClassId(Subjects subject, Long classId);
}