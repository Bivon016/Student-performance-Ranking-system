package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.AcademicPeriod;
import com.gradingSystem.GraadingSystem.model.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicPeriodRepo extends JpaRepository<AcademicPeriod, Long> {
    
    boolean existsByYearAndTerm(int year, int term);

    Optional<AcademicPeriod> findByIsCurrentTrue();
    List<AcademicPeriod> findBySchool(School school);
    Optional<AcademicPeriod> findByIsCurrentTrueAndSchool(School school);
    boolean existsByYearAndTermAndSchool(int year, int term, School school);
}
