package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.UsersRepo;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.User;
import com.gradingSystem.GraadingSystem.model.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class SchoolContextService {

    private final UsersRepo usersRepo;

    public SchoolContextService(UsersRepo usersRepo) {
        this.usersRepo = usersRepo;
    }

    public School getCurrentSchool() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        User user = usersRepo.findById(principal.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getSchool() == null)
            throw new RuntimeException("User is not linked to a school");
        return user.getSchool();
    }
}