package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.ExamRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.dto.ExamRequestDTO;
import com.gradingSystem.GraadingSystem.dto.ExamResponseDTO;
import com.gradingSystem.GraadingSystem.model.AcademicPeriod;
import com.gradingSystem.GraadingSystem.model.Exam;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class ExamService {
    private final ExamRepo examRepo;
    private final SubjectRepo subjectRepo;
    private final AcademicPeriodService academicPeriodService;
    private final SchoolContextService schoolContextService;

    public ExamService(ExamRepo examRepo, SubjectRepo subjectRepo,
                       AcademicPeriodService academicPeriodService, SchoolContextService schoolContextService) {
        this.examRepo = examRepo;
        this.subjectRepo = subjectRepo;
        this.academicPeriodService = academicPeriodService;
        this.schoolContextService = schoolContextService;
    }

    // ── Create exam ───────────────────────────────────────────────────────────
    public ExamResponseDTO createExam(ExamRequestDTO dto) {
        School school = schoolContextService.getCurrentSchool();
        Subjects subject = subjectRepo.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        AcademicPeriod currentPeriod = academicPeriodService.getCurrentPeriod();

        Exam exam = new Exam(dto.getExamType(), dto.getExamDate(),
                dto.getForm(), subject, currentPeriod, dto.getClassId(),school);

        return convertToDTO(examRepo.save(exam));
    }
    // ── Get all exams ─────────────────────────────────────────────────────────
    public List<ExamResponseDTO> getAllExams() {
        School school = schoolContextService.getCurrentSchool();
        return examRepo.findBySchool(school).stream().map(this::convertToDTO).toList();
    }

    //Get exams by subject + form  (used by frontend step 1 filter)
    public List<ExamResponseDTO> getExamsBySubjectAndForm(Long subjectId, int form) {

        School school = schoolContextService.getCurrentSchool();
        Subjects subject = subjectRepo.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        return examRepo.findBySchoolAndSubjectAndForm(school,subject, form)
                .stream().map(this::convertToDTO).toList();
    }

    // ── Get exams by form only ────────────────────────────────────────────────
    public List<ExamResponseDTO> getExamsByForm(int form) {
        School school = schoolContextService.getCurrentSchool();
        return examRepo.findBySchoolAndForm(school,form).stream().map(this::convertToDTO).toList();
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
                e.getSubject().getSubjectName(),
                e.getAcademicPeriod().getId(),        // ← add
                e.getAcademicPeriod().getYear(),       // ← add
                e.getAcademicPeriod().getTerm(),     // ← add
                e.getClassId()
        );
    }

    public List<ExamResponseDTO> getExamsBySubjectAndClass(Long subjectId, Long classId) {
        School school = schoolContextService.getCurrentSchool();
        Subjects subject = subjectRepo.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        return examRepo.findBySchoolAndSubjectAndClassId(school,subject, classId)
                .stream().map(this::convertToDTO).toList();
    }
}