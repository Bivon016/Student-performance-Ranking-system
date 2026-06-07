package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.StudentSubjectEnrollment;
import com.gradingSystem.GraadingSystem.model.Students;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentSubjectEnrollmentRepo extends JpaRepository<StudentSubjectEnrollment, Long> {

    List<StudentSubjectEnrollment> findByStudentAndSchool(Students student, School school);

    List<StudentSubjectEnrollment> findByStudentIdAndSchool(Long studentId, School school);

    boolean existsByStudentAndSubjectAndSchool(Students student, Subjects subject, School school);

    void deleteByStudentAndSubjectAndSchool(Students student, Subjects subject, School school);

    void deleteByStudentAndSchool(Students student, School school);

    // Fetch all enrollments for a list of students (used in results generation)
    @Query("SELECT e FROM StudentSubjectEnrollment e WHERE e.student.id IN :studentIds AND e.school = :school")
    List<StudentSubjectEnrollment> findByStudentIdsAndSchool(
            @Param("studentIds") List<Long> studentIds,
            @Param("school") School school
    );
}