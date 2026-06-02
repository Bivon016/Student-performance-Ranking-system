package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepo extends JpaRepository<Subjects,Long> {


    Optional<Subjects> findBysubjectIdAndSchool(Long subjectId, School school);
    List<Subjects> findBySchool(School school);
    Optional<Subjects> findBySchoolAndSubjectId(School school,Long subjectId );
}
