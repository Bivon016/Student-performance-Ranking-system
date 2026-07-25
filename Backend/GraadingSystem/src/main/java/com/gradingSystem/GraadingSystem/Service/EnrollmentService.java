package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.StudentSubjectEnrollmentRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectGroupRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.Repository.StudentRepo;
import com.gradingSystem.GraadingSystem.dto.*;
import com.gradingSystem.GraadingSystem.model.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class EnrollmentService {

    private final StudentSubjectEnrollmentRepo enrollmentRepo;
    private final SubjectRepo                  subjectRepo;
    private final StudentRepo                  studentRepo;
    private final SubjectGroupRepo             subjectGroupRepo;
    private final SchoolContextService         schoolContextService;

    public EnrollmentService(StudentSubjectEnrollmentRepo enrollmentRepo,
                             SubjectRepo subjectRepo,
                             StudentRepo studentRepo,
                             SubjectGroupRepo subjectGroupRepo,
                             SchoolContextService schoolContextService) {
        this.enrollmentRepo       = enrollmentRepo;
        this.subjectRepo          = subjectRepo;
        this.studentRepo          = studentRepo;
        this.subjectGroupRepo     = subjectGroupRepo;
        this.schoolContextService = schoolContextService;
    }

    /**
     * Bulk-enroll a student:
     *  - Auto-enroll all COMPULSORY subjects for this school
     *  - Enroll the optional subjects the principal selected per group
     *  - Validate min/max choices per group
     *  - Replaces any previous enrollment for this student (idempotent re-enrollment)
     */
    @Transactional
    public EnrollmentResponseDTO enrollStudent(BulkEnrollmentRequestDTO request) {

        School school = schoolContextService.getCurrentSchool();

        // 1. Load student
        Students student = studentRepo.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException(
                        "Student not found: " + request.getStudentId()));

        // 2. Wipe previous enrollments so this call is idempotent
        enrollmentRepo.deleteByStudentAndSchool(student, school);

        List<String>   warnings = new ArrayList<>();
        List<Subjects> toEnroll = new ArrayList<>();

        // 3. Auto-enroll all compulsory subjects
        List<Subjects> compulsorySubjects =
                subjectRepo.findBySchoolAndSubjectType(school, SubjectType.COMPULSORY);
        toEnroll.addAll(compulsorySubjects);

        // 4. Validate & collect optional subjects
        Map<String, List<Long>> optionalChoices =
                request.getOptionalSubjectsByGroup() != null
                        ? request.getOptionalSubjectsByGroup()
                        : Collections.emptyMap();

        // Load all subject groups for this school
        List<SubjectGroup> allGroups = subjectGroupRepo.findBySchool(school);
        Map<String, SubjectGroup> groupByName = allGroups.stream()
                .collect(Collectors.toMap(SubjectGroup::getGroupName, g -> g));

        // Load all optional subjects, group them by their SubjectGroup name via FK
        List<Subjects> allOptionals =
                subjectRepo.findBySchoolAndSubjectType(school, SubjectType.OPTIONAL);
        Map<String, List<Subjects>> subjectsByGroup = allOptionals.stream()
                .filter(s -> s.getSubjectGroup() != null)
                .collect(Collectors.groupingBy(s -> s.getSubjectGroup().getGroupName()));

        for (Map.Entry<String, List<Long>> entry : optionalChoices.entrySet()) {
            String     groupName = entry.getKey();
            List<Long> chosenIds = entry.getValue();

            SubjectGroup group = groupByName.get(groupName);
            if (group == null) {
                warnings.add("Unknown group '" + groupName + "' — skipped.");
                continue;
            }

            // Validate min/max
            int count = chosenIds == null ? 0 : chosenIds.size();
            if (count < group.getMinChoices()) {
                warnings.add("Group '" + groupName + "': at least " + group.getMinChoices()
                        + " subject(s) required, but only " + count + " selected.");
            }
            if (count > group.getMaxChoices()) {
                warnings.add("Group '" + groupName + "': at most " + group.getMaxChoices()
                        + " subject(s) allowed, but " + count + " were selected. Extra choices ignored.");
                chosenIds = chosenIds.subList(0, group.getMaxChoices());
            }

            // Validate chosen subjects actually belong to this group
            List<Subjects> groupSubjects =
                    subjectsByGroup.getOrDefault(groupName, Collections.emptyList());
            Set<Long> validIds = groupSubjects.stream()
                    .map(Subjects::getSubjectId)
                    .collect(Collectors.toSet());

            for (Long sid : chosenIds) {
                if (!validIds.contains(sid)) {
                    warnings.add("Subject ID " + sid + " does not belong to group '"
                            + groupName + "' — skipped.");
                } else {
                    groupSubjects.stream()
                            .filter(s -> s.getSubjectId().equals(sid))
                            .findFirst()
                            .ifPresent(toEnroll::add);
                }
            }
        }

        // 5. Warn about groups not mentioned at all that have a minChoices > 0
        for (SubjectGroup group : allGroups) {
            if (!optionalChoices.containsKey(group.getGroupName()) && group.getMinChoices() > 0) {
                warnings.add("Group '" + group.getGroupName() + "' was not provided — "
                        + group.getMinChoices() + " choice(s) required.");
            }
        }

        // 6. Persist enrollments (de-duplicate in case a subject appears twice somehow)
        Set<Long> enrolled = new HashSet<>();
        for (Subjects subject : toEnroll) {
            if (enrolled.add(subject.getSubjectId())) {
                StudentSubjectEnrollment enrollment = new StudentSubjectEnrollment();
                enrollment.setStudent(student);
                enrollment.setSubject(subject);
                enrollment.setSchool(school);
                enrollmentRepo.save(enrollment);
            }
        }

        // 7. Build response — extract group name safely via FK
        List<SubjectSummaryDTO> summaries = toEnroll.stream()
                .filter(s -> enrolled.contains(s.getSubjectId()))
                .distinct()
                .map(s -> new SubjectSummaryDTO(
                        s.getSubjectId(),
                        s.getSubjectName(),
                        s.getSubjectType(),
                        s.getSubjectGroup() != null ? s.getSubjectGroup().getGroupName() : null))
                .collect(Collectors.toList());

        return new EnrollmentResponseDTO(
                student.getId(),
                student.getFirstName() + " " + student.getSecondName(),
                summaries,
                warnings
        );
    }

    /**
     * Fetch the current subject enrollment for a student.
     */
    public EnrollmentResponseDTO getStudentEnrollment(Long studentId) {
        School   school  = schoolContextService.getCurrentSchool();
        Students student = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        List<StudentSubjectEnrollment> enrollments =
                enrollmentRepo.findByStudentIdAndSchool(studentId, school);

        List<SubjectSummaryDTO> summaries = enrollments.stream()
                .map(e -> {
                    Subjects     s   = e.getSubject();
                    SubjectGroup grp = s.getSubjectGroup();
                    return new SubjectSummaryDTO(
                            s.getSubjectId(),
                            s.getSubjectName(),
                            s.getSubjectType(),
                            grp != null ? grp.getGroupName() : null);
                })
                .collect(Collectors.toList());  // ← terminal operation was missing

        return new EnrollmentResponseDTO(
                student.getId(),
                student.getFirstName() + " " + student.getSecondName(),
                summaries,
                Collections.emptyList()
        );
    }

    /**
     * Remove a specific subject from a student's enrollment (e.g. subject change).
     */
    @Transactional
    public void removeSubjectFromStudent(Long studentId, Long subjectId) {
        School   school  = schoolContextService.getCurrentSchool();
        Students student = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        Subjects subject = subjectRepo.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found: " + subjectId));

        if (subject.getSubjectType() == SubjectType.COMPULSORY) {
            throw new RuntimeException("Cannot remove a compulsory subject from a student.");
        }

        // Guard: throw if student isn't actually enrolled in this subject
        if (!enrollmentRepo.existsByStudentAndSubjectAndSchool(student, subject, school)) {
            throw new RuntimeException("Student is not enrolled in subject: " + subjectId);
        }

        enrollmentRepo.deleteByStudentAndSubjectAndSchool(student, subject, school);
    }

    @Transactional
    public BatchEnrollmentResultDTO batchEnrollSubjects(BatchEnrollSubjectsDTO request) {
        School school = schoolContextService.getCurrentSchool();

        List<Subjects> subjects = subjectRepo.findAllById(request.getSubjectIds());
        List<Students> students = studentRepo.findAllById(request.getStudentIds());

        int enrolledCount = 0;
        List<String> skipped = new ArrayList<>();

        for (Students student : students) {
            for (Subjects subject : subjects) {
                boolean already = enrollmentRepo.existsByStudentAndSubjectAndSchool(student, subject, school);
                if (already) {
                    skipped.add(student.getFirstName() + " already in " + subject.getSubjectName());
                    continue;
                }
                StudentSubjectEnrollment e = new StudentSubjectEnrollment();
                e.setStudent(student);
                e.setSubject(subject);
                e.setSchool(school);
                enrollmentRepo.save(e);
                enrolledCount++;
            }
        }
        return new BatchEnrollmentResultDTO(enrolledCount, skipped);
    }
}