package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.SubjectGroupRepo;
import com.gradingSystem.GraadingSystem.Repository.SubjectRepo;
import com.gradingSystem.GraadingSystem.dto.SubjectDTO;
import com.gradingSystem.GraadingSystem.model.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectsService {

    private final SubjectRepo          subjectRepo;
    private final SchoolContextService schoolContextService;
    private final SubjectGroupRepo     subjectGroupRepo;  // ← add this

    public SubjectsService(SubjectRepo subjectRepo,
                           SchoolContextService schoolContextService,
                           SubjectGroupRepo subjectGroupRepo) {  // ← inject
        this.subjectRepo          = subjectRepo;
        this.schoolContextService = schoolContextService;
        this.subjectGroupRepo     = subjectGroupRepo;
    }

    public SubjectDTO addSubject(Subjects subject) {
        School school = schoolContextService.getCurrentSchool();
        subject.setSchool(school);

        // Resolve group by name from the nested object the frontend sends
        if (subject.getSubjectType() == SubjectType.OPTIONAL
                && subject.getSubjectGroup() != null
                && subject.getSubjectGroup().getGroupName() != null) {

            String groupName = subject.getSubjectGroup().getGroupName();
            SubjectGroup group = subjectGroupRepo
                    .findByGroupNameAndSchool(groupName, school)
                    .orElseThrow(() -> new RuntimeException("Group not found: " + groupName));
            subject.setSubjectGroup(group);
        } else {
            subject.setSubjectGroup(null);
        }

        return new SubjectDTO(subjectRepo.save(subject));
    }

    public SubjectDTO viewSubject(Long id) {
        School school = schoolContextService.getCurrentSchool();
        Subjects s = subjectRepo.findBySchoolAndSubjectId(school, id)
                .orElseThrow(() -> new RuntimeException("Subject not found: " + id));
        return new SubjectDTO(s);
    }

    public List<SubjectDTO> viewAllSubjects() {
        School school = schoolContextService.getCurrentSchool();
        return subjectRepo.findBySchool(school)
                .stream()
                .map(SubjectDTO::new)
                .collect(Collectors.toList());
    }

    public void deleteSubject(Long id) {
        School school = schoolContextService.getCurrentSchool();
        Subjects subject = subjectRepo.findBySchoolAndSubjectId(school, id)
                .orElseThrow(() -> new RuntimeException("Subject not found: " + id));
        subjectRepo.delete(subject);
    }

    public SubjectDTO updateSubject(Long id, Subjects updated) {
        School school = schoolContextService.getCurrentSchool();
        Subjects existing = subjectRepo.findBySchoolAndSubjectId(school, id)
                .orElseThrow(() -> new RuntimeException("Subject not found: " + id));

        existing.setSubjectName(updated.getSubjectName());
        existing.setSubjectType(updated.getSubjectType());

        // Resolve group by name
        if (updated.getSubjectType() == SubjectType.OPTIONAL
                && updated.getSubjectGroup() != null
                && updated.getSubjectGroup().getGroupName() != null) {

            String groupName = updated.getSubjectGroup().getGroupName();
            SubjectGroup group = subjectGroupRepo
                    .findByGroupNameAndSchool(groupName, school)
                    .orElseThrow(() -> new RuntimeException("Group not found: " + groupName));
            existing.setSubjectGroup(group);
        } else {
            existing.setSubjectGroup(null);
        }

        return new SubjectDTO(subjectRepo.save(existing));
    }
}