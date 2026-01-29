package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubjectRepo extends JpaRepository<Subjects,Long> {
}
