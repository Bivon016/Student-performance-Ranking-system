package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Classes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepo extends JpaRepository<Classes, Long> {

    List<Classes> findByFormNumber(Integer formNumber);
    List<Classes> findByYear(Integer year);
    List<Classes> findByFormNumberAndYear(Integer formNumber, Integer year);
    boolean existsByFormNumberAndStreamAndYear(Integer formNumber, String stream, Integer year);

    @Override
    Optional<Classes> findById(Long classId);
}