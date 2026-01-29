package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Students;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepo extends JpaRepository<Students,Long> {
}
