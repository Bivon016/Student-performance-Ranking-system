package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SchoolRepo extends JpaRepository<School,Long> {

    boolean existsBySchoolCode(String schoolCode);
    boolean existsByEmail(String email);

    Optional<School> findBySchoolCode(String schoolCode);

}
