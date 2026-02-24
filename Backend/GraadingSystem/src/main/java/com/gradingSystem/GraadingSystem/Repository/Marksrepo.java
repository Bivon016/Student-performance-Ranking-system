package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Marks;
import com.gradingSystem.GraadingSystem.model.Students;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface Marksrepo extends JpaRepository<Marks, Long> {

    // ✅ Prevent duplicate marks
    boolean existsByStudentAndSubject(Students student, Subjects subject);

    // ✅ View marks by student
    List<Marks> findByStudent(Students student);

    // ✅ View marks by subject
    List<Marks> findBySubject(Subjects subject);

    // ✅ Ranking totals by form
    @Query("""
        SELECT s.id, CONCAT(s.firstName, ' ', s.secondName), SUM(m.marksValue)
        FROM Marks m
        JOIN m.student s
        WHERE s.form = :form
        GROUP BY s.id, s.firstName, s.secondName
    """)
    List<Object[]> getStudentTotalsByForm(@Param("form") int form);
}