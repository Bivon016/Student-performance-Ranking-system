package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.TeacherAssignment;
import com.gradingSystem.GraadingSystem.model.Teachers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeacherAssignmentRepository extends JpaRepository<TeacherAssignment, Long> {

    List<TeacherAssignment> findByTeacher(Teachers teacher);

    @Query("SELECT COUNT(a) > 0 FROM TeacherAssignment a WHERE a.teacher = :teacher AND a.subject.subjectId = :subjectId AND a.assignedClass.classId = :classId")
    boolean existsByTeacherAndSubjectAndClass(
            @Param("teacher") Teachers teacher,
            @Param("subjectId") Long subjectId,
            @Param("classId") Long classId
    );
    @Query("SELECT COUNT(a) > 0 FROM TeacherAssignment a " +
            "WHERE a.teacher = :teacher AND a.assignedClass.classId = :classId")
    boolean existsByTeacherAndClass(
            @Param("teacher") Teachers teacher,
            @Param("classId") Long classId);

}