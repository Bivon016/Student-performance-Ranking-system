package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.Marksrepo;
import com.gradingSystem.GraadingSystem.Repository.StudentRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.dto.MarksBatchRequest;
import com.gradingSystem.GraadingSystem.dto.MarksResponseDTO;
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

    // =====================================================
    // ADD MARKS (Batch) → Returns DTO
    // =====================================================
    @Transactional
    public List<MarksResponseDTO> addMarksForManyStudents(MarksBatchRequest request) {

        Subjects subject = subjectRepo.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        List<Marks> marksList = new ArrayList<>();

        for (MarksBatchRequest.StudentMarks sm : request.getMarks()) {

            Students student = studentRepo.findById(sm.getStudentId())
                    .orElseThrow(() ->
                            new RuntimeException("Student not found: " + sm.getStudentId()));

            if (marksrepo.existsByStudentAndSubject(student, subject)) {
                throw new RuntimeException(
                        "Marks already exist for student "
                                + student.getId()
                                + " in subject "
                                + subject.getSubjectId()
                );
            }

            Marks marks = new Marks(
                    sm.getMarksValue(),
                    student,
                    subject
            );

            marksList.add(marks);
        }

        List<Marks> saved = marksrepo.saveAll(marksList);

        return saved.stream().map(this::convertToDTO).toList();
    }

    // =====================================================
    // VIEW ALL MARKS
    // =====================================================
    public List<MarksResponseDTO> getAllMarks() {
        return marksrepo.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =====================================================
    // VIEW BY STUDENT
    // =====================================================
    public List<MarksResponseDTO> getMarksByStudent(Long studentId) {

        Students student = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return marksrepo.findByStudent(student)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =====================================================
    // VIEW BY SUBJECT
    // =====================================================
    public List<MarksResponseDTO> getMarksBySubject(Long subjectId) {

        Subjects subject = subjectRepo.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        return marksrepo.findBySubject(subject)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =====================================================
    // UPDATE MARKS
    // =====================================================
    public MarksResponseDTO updateMarks(Long markId, int newMarksValue) {

        Marks marks = marksrepo.findById(markId)
                .orElseThrow(() -> new RuntimeException("Marks not found"));

        marks.setMarksValue(newMarksValue);

        return convertToDTO(marksrepo.save(marks));
    }

    // =====================================================
    // DELETE MARKS
    // =====================================================
    public void deleteMarks(Long markId) {

        Marks marks = marksrepo.findById(markId)
                .orElseThrow(() -> new RuntimeException("Marks not found"));

        marksrepo.delete(marks);
    }

    // =====================================================
    // CONVERTER METHOD
    // =====================================================
    private MarksResponseDTO convertToDTO(Marks m) {

        return new MarksResponseDTO(
                m.getMarksId(),
                m.getMarksValue(),
                m.getStudent().getId(),
                m.getStudent().getFirstName() + " " + m.getStudent().getSecondName(),
                m.getSubject().getSubjectId(),
                m.getSubject().getSubjectName()
        );
    }
}