package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class SubjectsService {

    @Autowired
    private SubjectRepo subjectRepo;

    // ---------- ADD SUBJECT ----------
    public Subjects addSubject(Subjects subject) {
        return subjectRepo.save(subject);
    }

    // ---------- VIEW SINGLE SUBJECT ----------
    public Subjects viewSubject(Long id) {
        return subjectRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found with id " + id));
    }

    // ---------- VIEW ALL SUBJECTS ----------
    public List<Subjects> viewAllSubjects() {
        return subjectRepo.findAll();
    }

    // ---------- DELETE SUBJECT ----------
    public void deleteSubject(Long id) {
        Subjects subject = subjectRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found with id " + id));
        subjectRepo.delete(subject);
    }

    // ---------- UPDATE SUBJECT ----------
    public Subjects updateSubject(Long id, Subjects newData) {
        Subjects subject = subjectRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found with id " + id));
        subject.setSubjectName(newData.getSubjectName());
        return subjectRepo.save(subject);
    }
}
