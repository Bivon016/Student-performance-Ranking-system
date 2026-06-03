package com.gradingSystem.GraadingSystem.Repository;

import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.Teachers;
import com.gradingSystem.GraadingSystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UsersRepo extends JpaRepository<User,Long> {
    User findByUsername(String username);

    boolean existsByUsername(String username);

    List<User> findBySchool(School school);
}
