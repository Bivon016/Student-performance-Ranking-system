package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.SubjectGroupRepo;
import com.gradingSystem.GraadingSystem.dto.SubjectGroupDTO;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.SubjectGroup;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectGroupService {

    private final SubjectGroupRepo     subjectGroupRepo;
    private final SchoolContextService schoolContextService;

    public SubjectGroupService(SubjectGroupRepo subjectGroupRepo,
                               SchoolContextService schoolContextService) {
        this.subjectGroupRepo     = subjectGroupRepo;
        this.schoolContextService = schoolContextService;
    }

    // ── helper: entity → DTO ─────────────────────────────────────────────────
    private SubjectGroupDTO toDTO(SubjectGroup g) {
        return new SubjectGroupDTO(g.getMinChoices(), g.getId(), g.getGroupName(), g.getMaxChoices());
    }

    private void applyDTO(SubjectGroupDTO dto, SubjectGroup entity) {
        entity.setGroupName(dto.getGroupName());
        entity.setMinChoices(dto.getMinChoices() != null ? dto.getMinChoices() : 1);
        entity.setMaxChoices(dto.getMaxChoices() != null ? dto.getMaxChoices() : 1);
    }

    public SubjectGroupDTO createNewSubjectGroup(SubjectGroupDTO dto) {
        School school = schoolContextService.getCurrentSchool();

        SubjectGroup entity = new SubjectGroup();
        applyDTO(dto, entity);
        entity.setSchool(school);

        return toDTO(subjectGroupRepo.save(entity));
    }

    public SubjectGroupDTO updateSubjectGroup(Long id, SubjectGroupDTO dto) {
        School school = schoolContextService.getCurrentSchool();

        SubjectGroup existing = subjectGroupRepo.findByIdAndSchool(id, school)
                .orElseThrow(() -> new RuntimeException("Subject group not found"));

        applyDTO(dto, existing);  // now correctly updates groupName + minChoices + maxChoices

        return toDTO(subjectGroupRepo.save(existing));
    }

    public void deleteSubjectGroup(Long id) {
        School school = schoolContextService.getCurrentSchool();

        SubjectGroup subjectGroup = subjectGroupRepo.findByIdAndSchool(id, school)
                .orElseThrow(() -> new RuntimeException("Subject group not found"));

        subjectGroupRepo.delete(subjectGroup);
    }

    public List<SubjectGroupDTO> getAllSubjectGroups() {
        School school = schoolContextService.getCurrentSchool();
        return subjectGroupRepo.findBySchool(school)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}