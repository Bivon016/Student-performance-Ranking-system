package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.ExamRepo;
import com.gradingSystem.GraadingSystem.Repository.Marksrepo;
import com.gradingSystem.GraadingSystem.Repository.StudentRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.dto.MarksBatchRequest;
import com.gradingSystem.GraadingSystem.dto.MarksResponseDTO;
import com.gradingSystem.GraadingSystem.model.Exam;
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

    @Autowired private Marksrepo   marksrepo;
    @Autowired private StudentRepo studentRepo;
    @Autowired private SubjectRepo subjectRepo;
    @Autowired private ExamRepo    examRepo;

    // =====================================================
    // ADD MARKS (Batch) — exam-aware
    // =====================================================
    @Transactional
    public List<MarksResponseDTO> addMarksForManyStudents(MarksBatchRequest request) {

        Subjects subject = subjectRepo.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        Exam exam = examRepo.findById(request.getExamId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        List<Marks> marksList = new ArrayList<>();

        for (MarksBatchRequest.StudentMarks sm : request.getMarks()) {

            Students student = studentRepo.findById(sm.getStudentId())
                    .orElseThrow(() ->
                            new RuntimeException("Student not found: " + sm.getStudentId()));

            if (marksrepo.existsByStudentAndExam(student, exam)) {
                throw new RuntimeException(
                        "Marks already exist for student " + student.getId()
                                + " in exam " + exam.getExamId());
            }

            marksList.add(new Marks(sm.getMarksValue(), student, subject, exam));
        }

        List<Marks> saved = marksrepo.saveAll(marksList);
        return saved.stream().map(this::convertToDTO).toList();
    }

    // =====================================================
    // VIEW ALL MARKS
    // =====================================================
    public List<MarksResponseDTO> getAllMarks() {
        return marksrepo.findAll().stream().map(this::convertToDTO).toList();
    }

    // =====================================================
    // VIEW BY STUDENT
    // =====================================================
    public List<MarksResponseDTO> getMarksByStudent(Long studentId) {
        Students student = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return marksrepo.findByStudent(student).stream().map(this::convertToDTO).toList();
    }

    // =====================================================
    // VIEW BY SUBJECT
    // =====================================================
    public List<MarksResponseDTO> getMarksBySubject(Long subjectId) {
        Subjects subject = subjectRepo.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        return marksrepo.findBySubject(subject).stream().map(this::convertToDTO).toList();
    }

    // =====================================================
    // VIEW BY EXAM
    // =====================================================
    public List<MarksResponseDTO> getMarksByExam(Long examId) {
        Exam exam = examRepo.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        return marksrepo.findByExam(exam).stream().map(this::convertToDTO).toList();
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
    // CONVERTER — null-safe for legacy rows without an exam
    // =====================================================
    private MarksResponseDTO convertToDTO(Marks m) {
        // Safely resolve the Hibernate proxy — old rows may have exam_id = 0 or NULL
        Exam exam = null;
        try {
            exam = m.getExam();
            if (exam != null) exam.getExamId(); // force proxy initialization
        } catch (Exception e) {
            exam = null; // legacy row — exam doesn't exist in DB, skip gracefully
        }

        return new MarksResponseDTO(
                m.getMarksId(),
                m.getMarksValue(),
                m.getStudent().getId(),
                m.getStudent().getFirstName() + " " + m.getStudent().getSecondName(),
                m.getSubject().getSubjectId(),
                m.getSubject().getSubjectName(),
                exam != null ? exam.getExamId()   : null,
                exam != null ? exam.getExamType() : null,
                exam != null ? exam.getExamDate() : null,
                exam != null ? exam.getForm()     : 0
        );
    }
}