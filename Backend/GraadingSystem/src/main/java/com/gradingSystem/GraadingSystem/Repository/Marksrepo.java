package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface Marksrepo extends JpaRepository<Marks, Long> {

    // ✅ Prevent duplicate marks
    boolean existsByStudentAndSubject(Students student, Subjects subject);

    boolean existsByStudentAndExam(Students student, Exam exam);

    // ✅ View marks by student
    List<Marks> findByStudent(Students student);

    // ✅ View marks by subject
    List<Marks> findBySubject(Subjects subject);

    List<Marks> findByExam(Exam exam);

    // Fetch all marks for a list of exam IDs

    @Query("SELECT m FROM Marks m JOIN FETCH m.student JOIN FETCH m.subject WHERE m.exam.examId IN :examIds")
    List<Marks> findByExamIdIn(@Param("examIds") List<Long> examIds);

    // ✅ Ranking totals by form
    @Query("""
        SELECT s.id, CONCAT(s.firstName, ' ', s.secondName), SUM(m.marksValue)
        FROM Marks m
        JOIN m.student s
        WHERE s.classId = :classId
        GROUP BY s.id, s.firstName, s.secondName
    """)
    List<Object[]> getStudentTotalsByForm(@Param("classId") int classId);


    @Query("""
    SELECT m FROM Marks m
    WHERE m.student = :student
    AND m.subject = :subject
    AND m.exam.examType = :examType
    AND m.exam.academicPeriod.id < :currentPeriodId
    ORDER BY m.exam.academicPeriod.id DESC
""")
    List<Marks> findPreviousMarkForStudent(
            @Param("student") Students student,
            @Param("subject") Subjects subject,
            @Param("examType") ExamType examType,
            @Param("currentPeriodId") Long currentPeriodId
    );
}