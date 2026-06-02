package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.ClassRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.Repository.TeacherAssignmentRepository;
import com.gradingSystem.GraadingSystem.Repository.TeachersRepo;
import com.gradingSystem.GraadingSystem.Repository.UsersRepo;
import com.gradingSystem.GraadingSystem.dto.AssignmentDTO;
import com.gradingSystem.GraadingSystem.dto.TeacherAssignmentRequest;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.TeacherAssignment;
import com.gradingSystem.GraadingSystem.model.Teachers;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;


import java.util.List;

@Service
public class TeachersService {

     public TeachersRepo teachersRepo;
     private UsersRepo usersRepo;
     private SubjectRepo subjectRepo;
     private ClassRepo classRepo;
     private TeacherAssignmentRepository assignmentRepo;
    private final SchoolContextService schoolContextService;

    public TeachersService(SchoolContextService schoolContextService, TeacherAssignmentRepository assignmentRepo,
                           ClassRepo classRepo, SubjectRepo subjectRepo, UsersRepo usersRepo, TeachersRepo teachersRepo) {
        this.schoolContextService = schoolContextService;
        this.assignmentRepo = assignmentRepo;
        this.classRepo = classRepo;
        this.subjectRepo = subjectRepo;
        this.usersRepo = usersRepo;
        this.teachersRepo = teachersRepo;
    }

    public Teachers addTeacher(Teachers teacher) {
        School school = schoolContextService.getCurrentSchool();
        teacher.setSchool(school);
        return teachersRepo.save(teacher);
    }

    public List<Teachers> getAllTeachers() {
        School school = schoolContextService.getCurrentSchool();
        return teachersRepo.findBySchool(school);
    }

    public void deleteTeacher(Long id) {
        School school = schoolContextService.getCurrentSchool();

        Teachers teacher = teachersRepo.findByIdAndSchool(id, school)
                .orElseThrow(() -> new EntityNotFoundException("Teacher does not exist"));

        teachersRepo.delete(teacher);
    }

    public Teachers linkUser(Long teacherId, Long userId) {
        Teachers teacher = teachersRepo.findById(teacherId)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));
        var user = usersRepo.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        teacher.setUser(user);
        return teachersRepo.save(teacher);
    }

    public AssignmentDTO addAssignment(Long teacherId, TeacherAssignmentRequest request) {

        School school = schoolContextService.getCurrentSchool();

        Teachers teacher = teachersRepo.findByIdAndSchool(teacherId, school)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));

        var subject = subjectRepo.findById(request.getSubjectId())
                .orElseThrow(() -> new EntityNotFoundException("Subject not found"));

        var classEntity = classRepo.findByClassIdAndSchool(
                        request.getClassId(),
                        school
                )
                .orElseThrow(() -> new EntityNotFoundException("Class not found"));

        if (assignmentRepo.existsByTeacherAndSubjectAndClass(
                teacher,
                request.getSubjectId(),
                request.getClassId())) {
            throw new IllegalStateException("Assignment already exists");
        }

        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setTeacher(teacher);
        assignment.setSubject(subject);
        assignment.setAssignedClass(classEntity);
        assignment.setSchool(school);

        TeacherAssignment saved = assignmentRepo.save(assignment);

        return new AssignmentDTO(
                saved.getId(),
                subject.getSubjectId(),
                subject.getSubjectName(),
                classEntity.getClassId(),
                classEntity.getClassName()
        );
    }

    public List<AssignmentDTO> getAssignments(Long teacherId) {

        School school = schoolContextService.getCurrentSchool();

        Teachers teacher = teachersRepo.findById(teacherId)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));

        return assignmentRepo.findByTeacherAndSchool(teacher, school)
                .stream()
                .map(a -> new AssignmentDTO(
                        a.getId(),
                        a.getSubject().getSubjectId(),
                        a.getSubject().getSubjectName(),
                        a.getAssignedClass().getClassId(),
                        a.getAssignedClass().getClassName()
                ))
                .toList();
    }

    public void deleteAssignment(Long assignmentId) {
        if (!assignmentRepo.existsById(assignmentId)) {
            throw new EntityNotFoundException("Assignment not found");
        }
        assignmentRepo.deleteById(assignmentId);
    }
}