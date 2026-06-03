package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.model.Exam;        // ← must be here
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.gradingSystem.GraadingSystem.Repository.TeacherAssignmentRepository;


import java.util.List;

@Service
public class SubjectsService {

    private SubjectRepo subjectRepo;
    private SchoolContextService schoolContextService;
    private TeacherAssignmentRepository teacherAssignmentRepository;

    public SubjectsService(SubjectRepo subjectRepo, SchoolContextService schoolContextService, TeacherAssignmentRepository teacherAssignmentRepository) {
        this.subjectRepo = subjectRepo;
        this.schoolContextService = schoolContextService;
        this.teacherAssignmentRepository = teacherAssignmentRepository;
    }

    public Subjects addSubject(Subjects subject) {
        School school = schoolContextService.getCurrentSchool();
        subject.setSchool(school);
        return subjectRepo.save(subject);
    }

    public Subjects viewSubject(Long id) {
        School school = schoolContextService.getCurrentSchool();
        return subjectRepo.findBysubjectIdAndSchool(id, school)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found with id " + id));
    }

    public List<Subjects> viewAllSubjects() {
        School school = schoolContextService.getCurrentSchool();
        return subjectRepo.findBySchool(school);
    }

    public Subjects updateSubject(Long id, Subjects newData) {
        School school = schoolContextService.getCurrentSchool();
        Subjects subject = subjectRepo.findBySchoolAndSubjectId(school, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found with id " + id));
        subject.setSubjectName(newData.getSubjectName());
        return subjectRepo.save(subject);
    }
    @Transactional
    public void deleteSubject(Long id) {
        School school = schoolContextService.getCurrentSchool();
        Subjects subject = subjectRepo.findBySchoolAndSubjectId(school, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found with id " + id));

        teacherAssignmentRepository.deleteBySubject_SubjectId(id);
        subjectRepo.delete(subject);
    }
}