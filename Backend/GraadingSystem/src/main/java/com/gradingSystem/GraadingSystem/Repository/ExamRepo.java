package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Exam;
import com.gradingSystem.GraadingSystem.model.ExamType;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
@Repository
public interface ExamRepo extends JpaRepository<Exam, Long> {

    List<Exam> findBySchoolAndSubjectAndForm(School school,Subjects subject, int form);

    // All exams for a subject  (used in view/reporting)
    List<Exam> findBySchoolAndSubject(School school,Subjects subject);

    // All exams for a form  (cross-subject view)
    List<Exam> findBySchoolAndForm(School school,int form);

    // Fetch all exams matching a set of form numbers and an exam type
    @Query("SELECT e FROM Exam e JOIN FETCH e.subject WHERE e.form IN :forms AND e.examType = :examType")
    List<Exam> findByFormInAndExamType(@Param("forms") Set<Integer> forms,
                                       @Param("examType") ExamType examType);
    List<Exam> findBySchoolAndSubjectAndClassId(School school, Subjects subject, Long classId);
    List<Exam> findBySchool(School school);

    @Query("SELECT e FROM Exam e JOIN FETCH e.subject WHERE e.form IN :forms AND e.examType = :examType AND e.school = :school")
    List<Exam> findByFormInAndExamTypeAndSchool(@Param("forms") Set<Integer> forms,
                                                @Param("examType") ExamType examType,
                                                @Param("school") School school);
}
