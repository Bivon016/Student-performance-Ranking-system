package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.Teachers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeachersRepo extends JpaRepository<Teachers, Long> {
    Optional<Teachers> findByUserIdAndSchool(Long userId, School school);

    List<Teachers> findBySchool(School school);

    Optional<Teachers> findByIdAndSchool(Long id, School school);
}
