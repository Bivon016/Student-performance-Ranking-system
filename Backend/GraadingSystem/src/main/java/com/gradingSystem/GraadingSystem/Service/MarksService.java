package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.ExamRepo;
import com.gradingSystem.GraadingSystem.Repository.Marksrepo;
import com.gradingSystem.GraadingSystem.Repository.StudentRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.dto.MarksBatchRequest;
import com.gradingSystem.GraadingSystem.dto.MarksResponseDTO;
import com.gradingSystem.GraadingSystem.dto.StudentComparisonDTO;
import com.gradingSystem.GraadingSystem.model.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MarksService {


    private final Marksrepo   marksrepo;
    private final StudentRepo studentRepo;
    private final SubjectRepo subjectRepo;
    private final ExamRepo    examRepo;
    private final SchoolContextService schoolContextService;
    private final AcademicPeriodService academicPeriodService;

    public MarksService(Marksrepo marksrepo, StudentRepo studentRepo, SubjectRepo subjectRepo,
                        ExamRepo examRepo, SchoolContextService schoolContextService,
                        AcademicPeriodService academicPeriodService) {
        this.marksrepo = marksrepo;
        this.studentRepo = studentRepo;
        this.subjectRepo = subjectRepo;
        this.examRepo = examRepo;
        this.schoolContextService = schoolContextService;
        this.academicPeriodService = academicPeriodService;
    }

    @Transactional
    public List<MarksResponseDTO> addMarksForManyStudents(MarksBatchRequest request) {


        Subjects subject = subjectRepo.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        Exam exam = examRepo.findById(request.getExamId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        academicPeriodService.assertPeriodIsWritable(exam.getAcademicPeriod());

        List<Marks> marksList = new ArrayList<>();

        School school = schoolContextService.getCurrentSchool();

        for (MarksBatchRequest.StudentMarks sm : request.getMarks()) {

            Students student = studentRepo.findById(sm.getStudentId())
                    .orElseThrow(() ->
                            new RuntimeException("Student not found: " + sm.getStudentId()));

            if (marksrepo.existsByStudentAndExam(student, exam)) {
                throw new RuntimeException(
                        "Marks already exist for student " + student.getId()
                                + " in exam " + exam.getExamId());
            }

            Marks mark = new Marks(
                    sm.getMarksValue(),
                    student,
                    subject,
                    exam
            );

            mark.setSchool(school);

            marksList.add(mark);
        }

// SAVE MARKS
        List<Marks> saved = marksrepo.saveAll(marksList);

// RETURN DTOs
        return saved.stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =====================================================
    // VIEW ALL MARKS
    // =====================================================
    public List<MarksResponseDTO> getAllMarks() {
        School school = schoolContextService.getCurrentSchool();

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
        academicPeriodService.assertPeriodIsWritable(marks.getExam().getAcademicPeriod());
        marks.setMarksValue(newMarksValue);
        return convertToDTO(marksrepo.save(marks));
    }

    // =====================================================
    // DELETE MARKS
    // =====================================================
    public void deleteMarks(Long markId) {
        Marks marks = marksrepo.findById(markId)
                .orElseThrow(() -> new RuntimeException("Marks not found"));
        academicPeriodService.assertPeriodIsWritable(marks.getExam().getAcademicPeriod());
        marksrepo.delete(marks);
    }
    public List<StudentComparisonDTO> getExamComparison(Long examId) {

        Exam exam = examRepo.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        List<Marks> currentMarks = marksrepo.findByExam(exam);
        Long currentPeriodId = exam.getAcademicPeriod().getId();

        return currentMarks.stream().map(m -> {
            List<Marks> previous = marksrepo.findPreviousMarkForStudent(
                    m.getStudent(),
                    m.getSubject(),
                    exam.getExamType(),
                    currentPeriodId
            );

            Integer prevValue = previous.isEmpty() ? null : previous.get(0).getMarksValue();
            Integer change    = prevValue == null   ? null : m.getMarksValue() - prevValue;

            return new StudentComparisonDTO(
                    m.getStudent().getId(),
                    m.getStudent().getFirstName() + " " + m.getStudent().getSecondName(),
                    m.getMarksValue(),
                    prevValue,
                    change
            );
        }).toList();
    }
    private MarksResponseDTO convertToDTO(Marks m) {

        Exam exam = null;
        try {
            exam = m.getExam();
            if (exam != null) exam.getExamId();
        } catch (Exception e) {
            exam = null;
        }

        MarksResponseDTO dto = new MarksResponseDTO(
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

        dto.setGradePoint(calculateGradePoint(m.getMarksValue()));

        return dto;
    }
    private double calculateGradePoint(int marks) {
        if (marks >= 90) return 8.0;
        if (marks >= 80) return 7.0;
        if (marks >= 70) return 6.0;
        if (marks >= 60) return 7.0;
        if (marks >= 50) return 4.0;
        if (marks >= 40) return 3.0;
        if (marks >= 30) return 2.0;
        return 1.0;
    }
}