package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Classes;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.Students;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepo extends JpaRepository<Students,Long> {

    // Fetch all students belonging to any of the given classIds
    List<Students> findBySchoolAndClassIdIn(School school,List<Long> classIds);


    List<Students> findBySchoolAndClassId(School school,Long classId);

    Optional<Students> findByIdAndSchool(Long id, School school);

    List<Students> findBySchool(School school);

}
