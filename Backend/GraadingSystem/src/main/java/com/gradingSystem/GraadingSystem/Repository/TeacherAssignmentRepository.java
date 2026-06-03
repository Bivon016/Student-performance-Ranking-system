package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Classes;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.TeacherAssignment;
import com.gradingSystem.GraadingSystem.model.Teachers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
public interface TeacherAssignmentRepository extends JpaRepository<TeacherAssignment, Long> {

    List<TeacherAssignment> findByTeacherAndSchool(Teachers teacher, School school);

    @Query("""
        SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
        FROM TeacherAssignment a
        WHERE a.teacher = :teacher
        AND a.subject.subjectId = :subjectId
        AND a.assignedClass.classId = :classId
    """)
    boolean existsByTeacherAndSubjectAndClass(
            @Param("teacher") Teachers teacher,
            @Param("subjectId") Long subjectId,
            @Param("classId") Long classId
    );
    void deleteBySubject_SubjectId(Long subjectId);

    @Query("""
        SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
        FROM TeacherAssignment a
        WHERE a.teacher = :teacher
        AND a.assignedClass.classId = :classId
    """)
    boolean existsByTeacherAndClass(
            @Param("teacher") Teachers teacher,
            @Param("classId") Long classId
    );
}