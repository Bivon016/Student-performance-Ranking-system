package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.ClassRepo;
import com.gradingSystem.GraadingSystem.Repository.ExamRepo;
import com.gradingSystem.GraadingSystem.Repository.Marksrepo;
import com.gradingSystem.GraadingSystem.Repository.StudentRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.dataStructures.MaxHeap;
import com.gradingSystem.GraadingSystem.dataStructures.StudentRankNode;
import com.gradingSystem.GraadingSystem.dto.ResultsResponseDTO;
import com.gradingSystem.GraadingSystem.dto.StudentResultDTO;
import com.gradingSystem.GraadingSystem.model.*;
import com.gradingSystem.GraadingSystem.model.Classes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RankingService {

    @Autowired private Marksrepo   marksrepo;
    @Autowired private StudentRepo studentRepo;
    @Autowired private ClassRepo   classRepo;
    @Autowired private ExamRepo    examRepo;
    @Autowired private SubjectRepo subjectRepo;

    // ── Legacy endpoint (kept for backwards compat) ───────────────────────────
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

    // ── Main results generation ───────────────────────────────────────────────
    /**
     * @param classIds  list of classIds to include (e.g. [5] for one stream, [5,6] for all Form 1)
     * @param examType  the exam type to aggregate marks for
     */
    public ResultsResponseDTO generateResults(List<Long> classIds, ExamType examType) {

        // 1. Load all classes and validate
        List<Classes> classes = classRepo.findAllById(classIds);
        if (classes.isEmpty()) throw new RuntimeException("No classes found for given IDs");

        // 2. Collect unique formNumbers from selected classes
        Set<Integer> formNumbers = classes.stream()
                .map(Classes::getFormNumber)
                .collect(Collectors.toSet());

        // 3. Get all students in selected classes
        List<Students> students = studentRepo.findByClassIdIn(classIds);
        if (students.isEmpty()) throw new RuntimeException("No students found in selected classes");

        // 4. Build classId → Classes map for display
        Map<Long, Classes> classMap = classes.stream()
                .collect(Collectors.toMap(Classes::getClassId, c -> c));

        // 5. Get all subjects (all subjects that have exams for these forms + this examType)
        List<Exam> relevantExams = examRepo.findByFormInAndExamType(formNumbers, examType);
        if (relevantExams.isEmpty()) throw new RuntimeException(
                "No exams of type " + examType + " found for the selected classes");

        // 6. Build ordered list of unique subject names
        List<String> subjectNames = relevantExams.stream()
                .map(e -> e.getSubject().getSubjectName())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

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

            double total = 0.0;
            for (String subjectName : subjectNames) {
                List<Double> values = marksForStudent.get(subjectName);
                if (values == null || values.isEmpty()) {
                    subjectTotals.put(subjectName, null);
                    missingSubjects.add(subjectName);
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
                    0 // rank assigned after sorting
            ));
        }

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

        // 12. Calculate subject averages (only over students who HAVE marks)
        Map<String, Double> subjectAverages = new LinkedHashMap<>();
        for (String subjectName : subjectNames) {
            List<Double> vals = ranked.stream()
                    .map(s -> s.getSubjectMarks().get(subjectName))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            double avg = vals.isEmpty() ? 0.0
                    : vals.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            subjectAverages.put(subjectName, Math.round(avg * 100.0) / 100.0);
        }

        // 13. Overall average = average of all subject averages
        double overallAverage = subjectAverages.values().stream()
                .mapToDouble(Double::doubleValue).average().orElse(0.0);
        overallAverage = Math.round(overallAverage * 100.0) / 100.0;

        boolean hasIssues = ranked.stream().anyMatch(StudentResultDTO::isHasIssues);

        return new ResultsResponseDTO(ranked, subjectNames, subjectAverages, overallAverage, hasIssues);
    }
}