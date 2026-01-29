package com.gradingSystem.GraadingSystem.Service;


import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SubjectsService {

    @Autowired
    public SubjectRepo subjectRepo;

    public Subjects addSubject(Subjects subjects){
        return subjectRepo.save(subjects);
    }
}
