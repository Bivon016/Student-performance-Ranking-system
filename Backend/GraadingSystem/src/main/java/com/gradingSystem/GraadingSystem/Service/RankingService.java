package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.*;
import com.gradingSystem.GraadingSystem.dataStructures.MaxHeap;
import com.gradingSystem.GraadingSystem.dataStructures.StudentRankNode;
import com.gradingSystem.GraadingSystem.dto.ClassSubjectRankingDTO;
import com.gradingSystem.GraadingSystem.dto.ResultsResponseDTO;
import com.gradingSystem.GraadingSystem.dto.SubjectClassStatsDTO;
import com.gradingSystem.GraadingSystem.dto.SubjectRankingResponseDTO;
import com.gradingSystem.GraadingSystem.dto.StudentResultDTO;
import com.gradingSystem.GraadingSystem.model.*;
import com.gradingSystem.GraadingSystem.model.Classes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RankingService {
    private final Marksrepo marksrepo;
    private final StudentRepo studentRepo;
    private final ClassRepo classRepo;
    private final ExamRepo examRepo;
    private final SubjectRepo subjectRepo;
    private final SchoolContextService schoolContextService;
    private final StudentSubjectEnrollmentRepo enrollmentRepo;
    private final AcademicPeriodService academicPeriodService;


    public RankingService(Marksrepo marksrepo, StudentRepo studentRepo, ClassRepo classRepo,
                          ExamRepo examRepo, SubjectRepo subjectRepo, SchoolContextService schoolContextService,
                          StudentSubjectEnrollmentRepo enrollmentRepo, AcademicPeriodService academicPeriodService) {
        this.marksrepo = marksrepo;
        this.studentRepo = studentRepo;
        this.classRepo = classRepo;
        this.examRepo = examRepo;
        this.subjectRepo = subjectRepo;
        this.schoolContextService = schoolContextService;
        this.enrollmentRepo = enrollmentRepo;
        this.academicPeriodService = academicPeriodService;
    }



    public List<com.gradingSystem.GraadingSystem.dto.StudentRankingDTO> rankStudentsByForm(int form) {
        List<Object[]> rawData = marksrepo.getStudentTotalsByForm(form);
        MaxHeap heap = new MaxHeap(rawData.size());
        for (Object[] row : rawData) {
            Long   studentId  = (Long)   row[0];
            String name       = (String) row[1];
            double totalMarks = ((Number) row[2]).doubleValue();
            // wrap in a minimal StudentResultDTO for the heap
            com.gradingSystem.GraadingSystem.dto.StudentResultDTO dto =
                    new com.gradingSystem.GraadingSystem.dto.StudentResultDTO(
                            studentId, name, null, null,
                            Collections.emptyMap(), Collections.emptyList(),
                            totalMarks, 0
                    );
            heap.insert(new StudentRankNode(dto));
        }
        List<com.gradingSystem.GraadingSystem.dto.StudentRankingDTO> rankings = new ArrayList<>();
        int rank = 1;
        while (!heap.isEmpty()) {
            StudentRankNode node = heap.extractMax();
            rankings.add(new com.gradingSystem.GraadingSystem.dto.StudentRankingDTO(
                    node.getResultDTO().getStudentId(),
                    node.getResultDTO().getStudentName(),
                    (int) node.getTotalMarks(),
                    rank++
            ));
        }
        return rankings;
    }

    // ── Shared data-gathering context ─────────────────────────────────────────
    // Holds the per-student subject totals + supporting lookups that both
    // generateResults() and generateSubjectRanking() need, so the aggregation
    // logic (enrollment handling, missing-mark handling, compulsory vs optional)
    // lives in exactly one place.
    private static final class StudentResultsContext {
        final List<StudentResultDTO> unranked;
        final List<String> allSubjectNames;
        final Set<String> compulsorySubjects;
        final AcademicPeriod period;

        StudentResultsContext(List<StudentResultDTO> unranked, List<String> allSubjectNames,
                               Set<String> compulsorySubjects, AcademicPeriod period) {
            this.unranked = unranked;
            this.allSubjectNames = allSubjectNames;
            this.compulsorySubjects = compulsorySubjects;
            this.period = period;
        }
    }

    private StudentResultsContext buildStudentResultsContext(List<Long> classIds, ExamType examType, Long periodId) {

        School school = schoolContextService.getCurrentSchool();
        AcademicPeriod period = academicPeriodService.resolvePeriod(periodId);

        // 1. Load all classes and validate
        List<Classes> classes = classRepo.findAllById(classIds);
        if (classes.isEmpty()) throw new RuntimeException("No classes found for given IDs");

        // 2. Collect unique formNumbers from selected classes
        Set<Integer> formNumbers = classes.stream()
                .map(Classes::getFormNumber)
                .collect(Collectors.toSet());

        // 3. Get all students in selected classes
        List<Students> students = studentRepo.findBySchoolAndClassIdIn(school, classIds);
        if (students.isEmpty()) throw new RuntimeException("No students found in selected classes");

        // 3b. Build per-student set of enrolled subjects using StudentSubjectEnrollmentRepo
        List<Long> studentIds = students.stream().map(Students::getId).collect(Collectors.toList());
        List<StudentSubjectEnrollment> allEnrollments =
                enrollmentRepo.findByStudentIdsAndSchool(studentIds, school);

        // studentId → Set<subjectName>
        Map<Long, Set<String>> studentEnrolledSubjects = new HashMap<>();
        for (StudentSubjectEnrollment e : allEnrollments) {
            studentEnrolledSubjects
                    .computeIfAbsent(e.getStudent().getId(), k -> new HashSet<>())
                    .add(e.getSubject().getSubjectName());
        }

        // 4. Build classId → Classes map for display
        Map<Long, Classes> classMap = classes.stream()
                .collect(Collectors.toMap(Classes::getClassId, c -> c));

        // 5. Get all relevant exams for this school + forms + examType
        List<Exam> relevantExams = examRepo.findByFormInAndExamTypeAndSchoolAndPeriod(
                formNumbers, examType, school, period);
        if (relevantExams.isEmpty()) throw new RuntimeException(
                "No exams of type " + examType + " found for Term "
                        + period.getTerm() + " " + period.getYear());

        // 6. Build subjectName → SubjectType map so we know which are compulsory
        //    Also build the global subject list (compulsory + all optionals that appear)
        Map<String, SubjectType> subjectTypeMap = new LinkedHashMap<>();
        for (Exam exam : relevantExams) {
            String name = exam.getSubject().getSubjectName();
            SubjectType type = exam.getSubject().getSubjectType() != null
                    ? exam.getSubject().getSubjectType()
                    : SubjectType.COMPULSORY; // default to compulsory if not set
            subjectTypeMap.put(name, type);
        }

        // Global subject list for column headers — all subjects sorted
        List<String> allSubjectNames = subjectTypeMap.keySet().stream()
                .sorted()
                .collect(Collectors.toList());

        // Compulsory subjects only — for missing marks flagging
        Set<String> compulsorySubjects = subjectTypeMap.entrySet().stream()
                .filter(e -> e.getValue() == SubjectType.COMPULSORY)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());

        // 7. Build subjectName → list of examIds map
        Map<String, List<Long>> subjectExamIds = new LinkedHashMap<>();
        for (Exam exam : relevantExams) {
            String name = exam.getSubject().getSubjectName();
            subjectExamIds.computeIfAbsent(name, k -> new ArrayList<>()).add(exam.getExamId());
        }

        // 8. Fetch all marks for relevant exams
        List<Long> allExamIds = relevantExams.stream()
                .map(Exam::getExamId).collect(Collectors.toList());
        List<Marks> allMarks = marksrepo.findByExamIdIn(allExamIds);

        // 9. Build nested map: studentId → subjectName → list of mark values
        Map<Long, Map<String, List<Double>>> studentSubjectMarks = new HashMap<>();
        for (Marks mark : allMarks) {
            Long   sid         = mark.getStudent().getId();
            String subjectName = mark.getSubject().getSubjectName();
            studentSubjectMarks
                    .computeIfAbsent(sid, k -> new HashMap<>())
                    .computeIfAbsent(subjectName, k -> new ArrayList<>())
                    .add((double) mark.getMarksValue());
        }

        // 10. Build StudentResultDTO for each student
        List<StudentResultDTO> unranked = new ArrayList<>();
        for (Students student : students) {
            Map<String, Double> subjectTotals  = new LinkedHashMap<>();
            List<String>        missingSubjects = new ArrayList<>();

            Map<String, List<Double>> marksForStudent =
                    studentSubjectMarks.getOrDefault(student.getId(), Collections.emptyMap());

            Set<String> enrolledSubjects =
                    studentEnrolledSubjects.getOrDefault(student.getId(), Collections.emptySet());

            double total = 0.0;

            for (String subjectName : allSubjectNames) {
                boolean isCompulsory = compulsorySubjects.contains(subjectName);
                boolean isEnrolled   = isCompulsory || enrolledSubjects.contains(subjectName);

                if (!isEnrolled) continue;

                List<Double> values = marksForStudent.get(subjectName);

                if (values == null || values.isEmpty()) {
                    if (isCompulsory) {
                        // Compulsory + no marks → count as 0, still flag as missing
                        subjectTotals.put(subjectName, 0.0);
                        missingSubjects.add(subjectName);
                    } else {
                        // Optional + enrolled + no marks → exclude from total, flag missing
                        subjectTotals.put(subjectName, null);
                        missingSubjects.add(subjectName);
                    }
                } else {
                    double sum = values.stream().mapToDouble(Double::doubleValue).sum();
                    subjectTotals.put(subjectName, sum);
                    total += sum;
                }
            }

            Classes cls = classMap.get(student.getClassId());
            unranked.add(new StudentResultDTO(
                    student.getId(),
                    student.getFirstName() + " " + student.getSecondName(),
                    student.getClassId(),
                    cls != null ? cls.getClassName() : "—",
                    subjectTotals,
                    missingSubjects,
                    total,
                    0
            ));
        }

        return new StudentResultsContext(unranked, allSubjectNames, compulsorySubjects, period);
    }

    // ── Main results generation ───────────────────────────────────────────────
    /**
     * @param classIds  list of classIds to include (e.g. [5] for one stream, [5,6] for all Form 1)
     * @param examType  the exam type to aggregate marks for
     */
    public ResultsResponseDTO generateResults(List<Long> classIds, ExamType examType, Long periodId) {

        StudentResultsContext ctx = buildStudentResultsContext(classIds, examType, periodId);
        List<StudentResultDTO> unranked          = ctx.unranked;
        List<String>           allSubjectNames    = ctx.allSubjectNames;
        Set<String>            compulsorySubjects = ctx.compulsorySubjects;
        AcademicPeriod         period             = ctx.period;

        // 11. Use MaxHeap to rank students by totalMarks (descending)
        MaxHeap heap = new MaxHeap(unranked.size());
        for (StudentResultDTO dto : unranked) {
            heap.insert(new StudentRankNode(dto));
        }

        List<StudentResultDTO> ranked = new ArrayList<>();
        int rank = 1;
        while (!heap.isEmpty()) {
            StudentResultDTO dto = heap.extractMax().getResultDTO();
            dto.setRank(rank++);
            ranked.add(dto);
        }

        // 12. Calculate subject averages — only for students who took that subject
        Map<String, Double> subjectAverages = new LinkedHashMap<>();
        for (String subjectName : allSubjectNames) {
            boolean isCompulsory = compulsorySubjects.contains(subjectName);

            if (isCompulsory) {
                // Include all enrolled students — missing compulsory marks count as 0
                List<Double> vals = ranked.stream()
                        .filter(s -> s.getSubjectMarks().containsKey(subjectName))
                        .map(s -> s.getSubjectMarks().getOrDefault(subjectName, 0.0))
                        .collect(Collectors.toList());

                double avg = vals.isEmpty() ? 0.0
                        : vals.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                subjectAverages.put(subjectName, Math.round(avg * 100.0) / 100.0);
            } else {
                // Optional — only average over students who actually took it and have marks
                List<Double> vals = ranked.stream()
                        .filter(s -> s.getSubjectMarks().containsKey(subjectName))
                        .map(s -> s.getSubjectMarks().get(subjectName))
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());

                double avg = vals.isEmpty() ? 0.0
                        : vals.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                subjectAverages.put(subjectName, Math.round(avg * 100.0) / 100.0);
            }
        }

        // 13. Overall average
        double overallAverage = subjectAverages.values().stream()
                .mapToDouble(Double::doubleValue).average().orElse(0.0);
        overallAverage = Math.round(overallAverage * 100.0) / 100.0;

        boolean hasIssues = ranked.stream().anyMatch(StudentResultDTO::isHasIssues);

        return new ResultsResponseDTO(
                ranked, allSubjectNames, subjectAverages, overallAverage, hasIssues,
                period.getId(), period.getYear(), period.getTerm());
    }

    // ── Per-class subject ranking (mean + deviation from last term) ────────────
    /**
     * For each selected class, ranks that class's subjects by mean score
     * (highest mean = rank 1) and reports how much that mean has moved since
     * the previous academic period (deviation = this term's mean − last
     * term's mean for the same class + subject). Deviation is null when
     * there's no earlier period on record, or the subject had no marks
     * recorded last term.
     *
     * @param classIds  list of classIds to include
     * @param examType  the exam type to aggregate marks for
     */
    public SubjectRankingResponseDTO generateSubjectRanking(List<Long> classIds, ExamType examType, Long periodId) {

        StudentResultsContext ctx = buildStudentResultsContext(classIds, examType, periodId);
        List<StudentResultDTO> unranked = ctx.unranked;

        // Group students by classId, preserving the order classIds were requested in
        Map<Long, List<StudentResultDTO>> byClass = unranked.stream()
                .collect(Collectors.groupingBy(StudentResultDTO::getClassId, LinkedHashMap::new, Collectors.toList()));

        // Previous period's per-class-per-subject means, if an earlier period with
        // matching data exists. Missing entirely just means "no comparison available".
        Map<Long, Map<String, Double>> previousMeans = Collections.emptyMap();
        Optional<AcademicPeriod> previousPeriodOpt = academicPeriodService.findPreviousPeriod(ctx.period);
        if (previousPeriodOpt.isPresent()) {
            try {
                StudentResultsContext prevCtx =
                        buildStudentResultsContext(classIds, examType, previousPeriodOpt.get().getId());
                previousMeans = computeClassSubjectMeans(prevCtx.unranked);
            } catch (RuntimeException e) {
                // No exams/students of this type recorded last period — leave previousMeans empty
            }
        }

        List<ClassSubjectRankingDTO> classResults = new ArrayList<>();

        for (Long classId : classIds) {
            List<StudentResultDTO> classStudents = byClass.get(classId);
            if (classStudents == null || classStudents.isEmpty()) continue;

            String className = classStudents.get(0).getClassName();

            // subjectName → list of per-student totals for students in THIS class who took it
            Map<String, List<Double>> subjectScores = new LinkedHashMap<>();
            for (StudentResultDTO student : classStudents) {
                for (Map.Entry<String, Double> entry : student.getSubjectMarks().entrySet()) {
                    Double value = entry.getValue();
                    if (value == null) continue; // not enrolled / no marks — excluded from stats
                    subjectScores.computeIfAbsent(entry.getKey(), k -> new ArrayList<>()).add(value);
                }
            }

            Map<String, Double> classPreviousMeans = previousMeans.getOrDefault(classId, Collections.emptyMap());

            List<SubjectClassStatsDTO> stats = new ArrayList<>();
            for (Map.Entry<String, List<Double>> entry : subjectScores.entrySet()) {
                String subjectName = entry.getKey();
                List<Double> values = entry.getValue();
                if (values.isEmpty()) continue;

                double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                double roundedMean = Math.round(mean * 100.0) / 100.0;

                Double previousMean = classPreviousMeans.get(subjectName);
                Double roundedPreviousMean = previousMean != null
                        ? Math.round(previousMean * 100.0) / 100.0 : null;
                Double deviation = previousMean != null
                        ? Math.round((mean - previousMean) * 100.0) / 100.0 : null;

                stats.add(new SubjectClassStatsDTO(
                        subjectName,
                        roundedMean,
                        values.size(),
                        0, // rank assigned below
                        roundedPreviousMean,
                        deviation
                ));
            }

            // Rank subjects within this class by mean, descending (rank 1 = highest mean)
            stats.sort((a, b) -> Double.compare(b.getMean(), a.getMean()));
            for (int i = 0; i < stats.size(); i++) {
                stats.get(i).setRank(i + 1);
            }

            classResults.add(new ClassSubjectRankingDTO(classId, className, stats));
        }

        AcademicPeriod period = ctx.period;
        return new SubjectRankingResponseDTO(
                classResults, period.getId(), period.getYear(), period.getTerm());
    }

    // subjectName → mean, grouped by classId, for an arbitrary list of StudentResultDTOs
    // (used to compute the previous period's per-class-per-subject means for comparison)
    private Map<Long, Map<String, Double>> computeClassSubjectMeans(List<StudentResultDTO> students) {
        Map<Long, Map<String, List<Double>>> grouped = new LinkedHashMap<>();
        for (StudentResultDTO student : students) {
            for (Map.Entry<String, Double> entry : student.getSubjectMarks().entrySet()) {
                if (entry.getValue() == null) continue;
                grouped.computeIfAbsent(student.getClassId(), k -> new LinkedHashMap<>())
                        .computeIfAbsent(entry.getKey(), k -> new ArrayList<>())
                        .add(entry.getValue());
            }
        }

        Map<Long, Map<String, Double>> means = new LinkedHashMap<>();
        for (Map.Entry<Long, Map<String, List<Double>>> classEntry : grouped.entrySet()) {
            Map<String, Double> subjectMeans = new LinkedHashMap<>();
            for (Map.Entry<String, List<Double>> subjEntry : classEntry.getValue().entrySet()) {
                double mean = subjEntry.getValue().stream()
                        .mapToDouble(Double::doubleValue).average().orElse(0.0);
                subjectMeans.put(subjEntry.getKey(), mean);
            }
            means.put(classEntry.getKey(), subjectMeans);
        }
        return means;
    }
}
