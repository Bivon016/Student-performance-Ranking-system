package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Marks;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface Marksrepo extends JpaRepository<Marks, Long> {
    @Query("""
                SELECT s.id, CONCAT(s.firstName, ' ', s.secondName), SUM(m.marksValue)
                FROM Marks m
                JOIN m.student s
                WHERE s.form = :form
                GROUP BY s.id, s.firstName, s.secondName
            """)
    List<Object[]> getStudentTotalsByForm(@Param("form") int form);
}
