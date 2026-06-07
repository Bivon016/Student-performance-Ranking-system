package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.SubjectGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectGroupRepo extends JpaRepository<SubjectGroup, Long> {

    Optional<SubjectGroup> findByIdAndSchool(Long id, School school);

    List<SubjectGroup> findBySchool(School school);

    Optional<SubjectGroup> findByGroupNameAndSchool(String groupName, School school); // ← added
}