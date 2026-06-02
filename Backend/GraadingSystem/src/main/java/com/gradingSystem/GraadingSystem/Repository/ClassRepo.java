package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Classes;
import com.gradingSystem.GraadingSystem.model.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepo extends JpaRepository<Classes, Long> {

    List<Classes> findBySchool(School school);

    List<Classes> findBySchoolAndFormNumber(
            School school, Integer formNumber);

    List<Classes> findBySchoolAndYear(
            School school, Integer year);

    boolean existsByFormNumberAndStreamAndYearAndSchool(
            Integer formNumber,
            String stream,
            Integer year,
            School school
    );

    Optional<Classes> findByClassIdAndSchool(Long classId, School school);

    Optional<Classes> findByClassId(Long classId);
//    Optional<Classes> findByIdAndSchool(
//            Long classId,
//            School school
//    );
}