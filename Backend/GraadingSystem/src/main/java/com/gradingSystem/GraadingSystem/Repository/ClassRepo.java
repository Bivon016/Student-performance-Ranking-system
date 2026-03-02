package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.Class;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassRepo extends JpaRepository<Class, Long> {

    List<Class> findByFormNumber(Integer formNumber);
    List<Class> findByYear(Integer year);
    List<Class> findByFormNumberAndYear(Integer formNumber, Integer year);
    boolean existsByFormNumberAndStreamAndYear(Integer formNumber, String stream, Integer year);
}