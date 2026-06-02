package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.TeacherAssignmentRepository;
import com.gradingSystem.GraadingSystem.Repository.TeachersRepo;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service("teacherAuthService")
public class TeacherAuthorizationService {

    private final TeacherAssignmentRepository assignmentRepo;
    private final TeachersRepo teachersRepo;
    private final SchoolContextService schoolContextService;

    public TeacherAuthorizationService(TeacherAssignmentRepository assignmentRepo,
                                       TeachersRepo teachersRepo, SchoolContextService schoolContextService) {
        this.assignmentRepo = assignmentRepo;
        this.teachersRepo = teachersRepo;
        this.schoolContextService = schoolContextService;
    }

    public boolean isAssignedTo(Long subjectId, Long classId) {
        School school = schoolContextService.getCurrentSchool();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;

        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        Long userId = principal.getUser().getId();

        return teachersRepo.findByUserIdAndSchool(userId,school)
                .map(teacher -> assignmentRepo
                        .existsByTeacherAndSubjectAndClass(
                                teacher, subjectId, classId))  // ✅ updated
                .orElse(false);
    }

    public boolean isAssignedTo(Long classId){
        School school = schoolContextService.getCurrentSchool();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        Long userId = principal.getUser().getId();

        return teachersRepo.findByUserIdAndSchool(userId,school)
                .map(teacher -> assignmentRepo.existsByTeacherAndClass(teacher,classId))
                .orElse(false);
    }
}