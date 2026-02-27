package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.ExamRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.dto.ExamRequestDTO;
import com.gradingSystem.GraadingSystem.dto.ExamResponseDTO;
import com.gradingSystem.GraadingSystem.model.Exam;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExamService {

    @Autowired
    private ExamRepo examRepo;

    @Autowired
    private SubjectRepo subjectRepo;

    // ── Create exam ───────────────────────────────────────────────────────────
    public ExamResponseDTO createExam(ExamRequestDTO dto) {

        Subjects subject = subjectRepo.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        Exam exam = new Exam(dto.getExamType(), dto.getExamDate(), dto.getForm(), subject);

        return convertToDTO(examRepo.save(exam));
    }

    // ── Get all exams ─────────────────────────────────────────────────────────
    public List<ExamResponseDTO> getAllExams() {
        return examRepo.findAll().stream().map(this::convertToDTO).toList();
    }

    // ── Get exams by subject + form  (used by frontend step 1 filter) ─────────
    public List<ExamResponseDTO> getExamsBySubjectAndForm(Long subjectId, int form) {

        Subjects subject = subjectRepo.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        return examRepo.findBySubjectAndForm(subject, form)
                .stream().map(this::convertToDTO).toList();
    }

    // ── Get exams by form only ────────────────────────────────────────────────
    public List<ExamResponseDTO> getExamsByForm(int form) {
        return examRepo.findByForm(form).stream().map(this::convertToDTO).toList();
    }

    // ── Delete exam ───────────────────────────────────────────────────────────
    public void deleteExam(Long examId) {
        Exam exam = examRepo.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        examRepo.delete(exam);
    }

    // ── Converter ─────────────────────────────────────────────────────────────
    private ExamResponseDTO convertToDTO(Exam e) {
        return new ExamResponseDTO(
                e.getExamId(),
                e.getExamType(),
                e.getExamDate(),
                e.getForm(),
                e.getSubject().getSubjectId(),
                e.getSubject().getSubjectName()
        );
    }
}