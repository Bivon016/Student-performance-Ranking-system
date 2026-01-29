package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Teachers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeachersRepo extends JpaRepository<Teachers, Long> {
}
