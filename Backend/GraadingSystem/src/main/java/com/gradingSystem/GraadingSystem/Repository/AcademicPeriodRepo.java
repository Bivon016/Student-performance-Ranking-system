package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.AcademicPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AcademicPeriodRepo extends JpaRepository<AcademicPeriod, Long> {
    
    boolean existsByYearAndTerm(int year, int term);

    Optional<AcademicPeriod> findByIsCurrentTrue();
}
