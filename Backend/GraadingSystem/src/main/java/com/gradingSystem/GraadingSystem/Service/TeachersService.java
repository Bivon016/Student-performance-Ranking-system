package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.ClassRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.Repository.TeacherAssignmentRepository;
import com.gradingSystem.GraadingSystem.Repository.TeachersRepo;
import com.gradingSystem.GraadingSystem.Repository.UsersRepo;
import com.gradingSystem.GraadingSystem.dto.AssignmentDTO;
import com.gradingSystem.GraadingSystem.dto.TeacherAssignmentRequest;
import com.gradingSystem.GraadingSystem.model.TeacherAssignment;
import com.gradingSystem.GraadingSystem.model.Teachers;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TeachersService {

    @Autowired public TeachersRepo teachersRepo;
    @Autowired private UsersRepo usersRepo;
    @Autowired private SubjectRepo subjectRepo;
    @Autowired private ClassRepo classRepo;
    @Autowired private TeacherAssignmentRepository assignmentRepo;

    public Teachers addTeacher(Teachers teacher) {
        return teachersRepo.save(teacher);
    }

    public List<Teachers> getAllTeachers() {
        return teachersRepo.findAll();
    }

    public void deleteTeacher(Long id) {
        if (!teachersRepo.existsById(id)) {
            throw new EntityNotFoundException("Teacher does not exist");
        }
        teachersRepo.deleteById(id);
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
        Teachers teacher = teachersRepo.findById(teacherId)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));
        var subject = subjectRepo.findById(request.getSubjectId())
                .orElseThrow(() -> new EntityNotFoundException("Subject not found"));
        var classEntity = classRepo.findById(request.getClassId())
                .orElseThrow(() -> new EntityNotFoundException("Classes not found"));

        if (assignmentRepo.existsByTeacherAndSubjectAndClass(
                teacher, request.getSubjectId(), request.getClassId())) {
            throw new IllegalStateException("Assignment already exists");
        }

        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setTeacher(teacher);
        assignment.setSubject(subject);
        assignment.setAssignedClass(classEntity);
        TeacherAssignment saved = assignmentRepo.save(assignment); // ✅ capture saved

        return new AssignmentDTO(
                saved.getId(),                              // ✅ use saved.getId()
                subject.getSubjectId(), subject.getSubjectName(),
                classEntity.getClassId(), classEntity.getClassName()
        );
    }

    public List<AssignmentDTO> getAssignments(Long teacherId) {
        Teachers teacher = teachersRepo.findById(teacherId)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));
        return assignmentRepo.findByTeacher(teacher)
                .stream()
                .map(a -> new AssignmentDTO(
                        a.getId(),
                        a.getSubject().getSubjectId(), a.getSubject().getSubjectName(),
                        a.getAssignedClass().getClassId(), a.getAssignedClass().getClassName()
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