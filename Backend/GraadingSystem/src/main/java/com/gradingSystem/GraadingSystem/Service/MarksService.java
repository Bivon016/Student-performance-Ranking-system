package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.Marksrepo;
import com.gradingSystem.GraadingSystem.Repository.StudentRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.dto.MarksBatchRequest;
import com.gradingSystem.GraadingSystem.model.Marks;
import com.gradingSystem.GraadingSystem.model.Students;
import com.gradingSystem.GraadingSystem.model.Subjects;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MarksService {

    @Autowired
    private Marksrepo marksrepo;

    @Autowired
    private StudentRepo studentRepo;

    @Autowired
    private SubjectRepo subjectRepo;


    @Transactional
    public List<Marks> addMarksForManyStudents(MarksBatchRequest request) {

        // 1️⃣ Get the subject
        Subjects subject = subjectRepo.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        List<Marks> marksList = new ArrayList<>();


        for (MarksBatchRequest.StudentMarks sm : request.getMarks()) {

            Students student = studentRepo.findById(sm.getStudentId())
                    .orElseThrow(() ->
                            new RuntimeException("Student not found: " + sm.getStudentId()));


            if (marksrepo.existsByStudentAndSubject(student, subject)) {
                throw new RuntimeException(
                        "Marks already exist for student " + student.getId()
                                + " in subject " + subject.getSubjectId()
                );
            }


            Marks marks = new Marks(
                    sm.getMarksValue(),
                    student,
                    subject
            );

            marksList.add(marks);
        }


        List<Marks> savedMarks = marksrepo.saveAll(marksList);



        return savedMarks;
    }
}
