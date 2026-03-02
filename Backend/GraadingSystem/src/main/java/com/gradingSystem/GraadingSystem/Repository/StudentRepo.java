package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Students;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepo extends JpaRepository<Students,Long> {

    // Fetch all students belonging to any of the given classIds
    List<Students> findByClassIdIn(List<Long> classIds);
}
