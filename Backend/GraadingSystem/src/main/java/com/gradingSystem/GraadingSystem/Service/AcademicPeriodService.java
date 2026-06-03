package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.AcademicPeriodRepo;
import com.gradingSystem.GraadingSystem.model.AcademicPeriod;
import com.gradingSystem.GraadingSystem.model.School;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AcademicPeriodService {

    private final AcademicPeriodRepo academicPeriodRepo;
    private final SchoolContextService schoolContextService;

    public AcademicPeriodService(AcademicPeriodRepo academicPeriodRepo,
                                 SchoolContextService schoolContextService) {
        this.academicPeriodRepo = academicPeriodRepo;
        this.schoolContextService = schoolContextService;
    }

    public AcademicPeriod createAcademicPeriod(AcademicPeriod academicPeriod) {
        School school = schoolContextService.getCurrentSchool();

        if (academicPeriodRepo.existsByYearAndTermAndSchool(
                academicPeriod.getYear(), academicPeriod.getTerm(), school)) {
            throw new RuntimeException("Academic period already exists for this school");
        }

        if (academicPeriod.isCurrent()) {
            academicPeriodRepo.findByIsCurrentTrueAndSchool(school)
                    .ifPresent(existing -> {
                        existing.setCurrent(false);
                        academicPeriodRepo.save(existing);
                    });
        }

        academicPeriod.setSchool(school); // ✅ link to school
        return academicPeriodRepo.save(academicPeriod);
    }

    public AcademicPeriod getCurrentPeriod() {
        School school = schoolContextService.getCurrentSchool();
        return academicPeriodRepo.findByIsCurrentTrueAndSchool(school)
                .orElseThrow(() -> new RuntimeException("No active academic period"));
    }

    public AcademicPeriod setCurrentPeriod(Long id) {
        School school = schoolContextService.getCurrentSchool();

        academicPeriodRepo.findByIsCurrentTrueAndSchool(school)
                .ifPresent(existing -> {
                    existing.setCurrent(false);
                    academicPeriodRepo.save(existing);
                });

        AcademicPeriod period = academicPeriodRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Period not found"));
        period.setCurrent(true);
        return academicPeriodRepo.save(period);
    }

    public List<AcademicPeriod> getAllPeriods() {
        School school = schoolContextService.getCurrentSchool();
        return academicPeriodRepo.findBySchool(school); // ✅ scoped to school
    }
}