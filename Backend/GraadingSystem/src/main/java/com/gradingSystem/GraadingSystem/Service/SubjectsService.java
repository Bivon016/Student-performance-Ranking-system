package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class SubjectsService {


    private SubjectRepo subjectRepo;
    private SchoolContextService schoolContextService;


    public SubjectsService(SubjectRepo subjectRepo, SchoolContextService schoolContextService) {
        this.subjectRepo = subjectRepo;
        this.schoolContextService = schoolContextService;
    }

    public Subjects addSubject(Subjects subject) {
        School school = schoolContextService.getCurrentSchool();
        subject.setSchool(school);
        return subjectRepo.save(subject);
    }

    // ---------- VIEW SINGLE SUBJECT ----------
    public Subjects viewSubject(Long id) {
        School school = schoolContextService.getCurrentSchool();
        return subjectRepo.findBysubjectIdAndSchool(id,school)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found with id " + id));
    }

    // ---------- VIEW ALL SUBJECTS ----------
    public List<Subjects> viewAllSubjects() {
        School school = schoolContextService.getCurrentSchool();
        return subjectRepo.findBySchool(school);
    }

    // ---------- DELETE SUBJECT ----------
    public void deleteSubject(Long id) {
        School school = schoolContextService.getCurrentSchool();
        Subjects subject = subjectRepo.findBySchoolAndSubjectId(school,id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found with id " + id));
        subjectRepo.delete(subject);
    }

    // ---------- UPDATE SUBJECT ----------
    public Subjects updateSubject(Long id, Subjects newData) {
        School school = schoolContextService.getCurrentSchool();
        Subjects subject = subjectRepo.findBySchoolAndSubjectId(school,id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found with id " + id));
        subject.setSubjectName(newData.getSubjectName());
        return subjectRepo.save(subject);
    }
}
