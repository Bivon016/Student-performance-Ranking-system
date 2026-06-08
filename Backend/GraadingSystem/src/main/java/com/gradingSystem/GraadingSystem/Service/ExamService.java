package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.ExamRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.dto.ExamRequestDTO;
import com.gradingSystem.GraadingSystem.dto.ExamResponseDTO;
import com.gradingSystem.GraadingSystem.model.AcademicPeriod;
import com.gradingSystem.GraadingSystem.model.Exam;
import com.gradingSystem.GraadingSystem.model.PeriodStatus;
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

    public ExamResponseDTO createExam(ExamRequestDTO dto) {
        School school = schoolContextService.getCurrentSchool();
        Subjects subject = subjectRepo.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        AcademicPeriod currentPeriod = academicPeriodService.getCurrentPeriod();
        academicPeriodService.assertPeriodIsWritable(currentPeriod);

        Exam exam = new Exam(dto.getExamType(), dto.getExamDate(),
                dto.getForm(), subject, currentPeriod, dto.getClassId(), school);

        return convertToDTO(examRepo.save(exam));
    }

    public List<ExamResponseDTO> getAllExams(Long periodId) {
        School school = schoolContextService.getCurrentSchool();
        AcademicPeriod period = academicPeriodService.resolvePeriod(periodId);
        return examRepo.findBySchoolAndAcademicPeriod(school, period)
                .stream().map(this::convertToDTO).toList();
    }

    public List<ExamResponseDTO> getExamsBySubjectAndForm(Long subjectId, int form, Long periodId) {
        School school = schoolContextService.getCurrentSchool();
        AcademicPeriod period = academicPeriodService.resolvePeriod(periodId);
        Subjects subject = subjectRepo.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        return examRepo.findBySchoolAndSubjectAndFormAndAcademicPeriod(school, subject, form, period)
                .stream().map(this::convertToDTO).toList();
    }

    public List<ExamResponseDTO> getExamsByForm(int form, Long periodId) {
        School school = schoolContextService.getCurrentSchool();
        AcademicPeriod period = academicPeriodService.resolvePeriod(periodId);
        return examRepo.findBySchoolAndFormAndAcademicPeriod(school, form, period)
                .stream().map(this::convertToDTO).toList();
    }

    public void deleteExam(Long examId) {
        Exam exam = examRepo.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        academicPeriodService.assertPeriodIsWritable(exam.getAcademicPeriod());
        examRepo.delete(exam);
    }

    public List<ExamResponseDTO> getExamsBySubjectAndClass(Long subjectId, Long classId, Long periodId) {
        School school = schoolContextService.getCurrentSchool();
        AcademicPeriod period = academicPeriodService.resolvePeriod(periodId);
        Subjects subject = subjectRepo.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        return examRepo.findBySchoolAndSubjectAndClassIdAndAcademicPeriod(school, subject, classId, period)
                .stream().map(this::convertToDTO).toList();
    }

    private ExamResponseDTO convertToDTO(Exam e) {
        AcademicPeriod period = e.getAcademicPeriod();
        boolean readOnly = period.getStatus() == PeriodStatus.CLOSED;
        return new ExamResponseDTO(
                e.getExamId(),
                e.getExamType(),
                e.getExamDate(),
                e.getForm(),
                e.getSubject().getSubjectId(),
                e.getSubject().getSubjectName(),
                period.getId(),
                period.getYear(),
                period.getTerm(),
                period.getStatus().name(),
                readOnly,
                e.getClassId()
        );
    }
}
