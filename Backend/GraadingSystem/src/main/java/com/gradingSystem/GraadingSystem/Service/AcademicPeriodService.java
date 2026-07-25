package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.AcademicPeriodRepo;
import com.gradingSystem.GraadingSystem.model.AcademicPeriod;
import com.gradingSystem.GraadingSystem.model.PeriodStatus;
import com.gradingSystem.GraadingSystem.model.School;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

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
            closeCurrentPeriod(school);
        }

        academicPeriod.setSchool(school);
        if (academicPeriod.isCurrent()) {
            academicPeriod.setStatus(PeriodStatus.ACTIVE);
        } else if (academicPeriod.getStatus() == null) {
            academicPeriod.setStatus(PeriodStatus.ACTIVE);
        }
        return academicPeriodRepo.save(academicPeriod);
    }

    public AcademicPeriod getCurrentPeriod() {
        School school = schoolContextService.getCurrentSchool();
        return academicPeriodRepo.findByIsCurrentTrueAndSchool(school)
                .orElseThrow(() -> new RuntimeException("No active academic period"));
    }

    public AcademicPeriod getPeriodById(Long periodId) {
        School school = schoolContextService.getCurrentSchool();
        AcademicPeriod period = academicPeriodRepo.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Period not found"));
        if (!period.getSchool().getSchoolId().equals(school.getSchoolId())) {
            throw new RuntimeException("Period does not belong to this school");
        }
        return period;
    }

    public AcademicPeriod resolvePeriod(Long periodId) {
        return periodId != null ? getPeriodById(periodId) : getCurrentPeriod();
    }

    public void assertPeriodIsWritable(AcademicPeriod period) {
        if (period.getStatus() == PeriodStatus.CLOSED) {
            throw new RuntimeException(
                    "Cannot modify data for closed academic period (Term "
                            + period.getTerm() + ", " + period.getYear() + ")");
        }
    }

    public AcademicPeriod setCurrentPeriod(Long id) {
        School school = schoolContextService.getCurrentSchool();

        AcademicPeriod period = academicPeriodRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Period not found"));

        if (!period.getSchool().getSchoolId().equals(school.getSchoolId())) {
            throw new RuntimeException("Period does not belong to this school");
        }
        if (period.getStatus() == PeriodStatus.CLOSED) {
            throw new RuntimeException("Cannot reactivate a closed academic period");
        }

        closeCurrentPeriod(school);

        period.setCurrent(true);
        period.setStatus(PeriodStatus.ACTIVE);
        return academicPeriodRepo.save(period);
    }

    public List<AcademicPeriod> getAllPeriods() {
        School school = schoolContextService.getCurrentSchool();
        return academicPeriodRepo.findBySchool(school);
    }

    /**
     * Finds the chronologically previous academic period for the same school
     * (e.g. Term 1 2026 → Term 3 2025, or Term 2 2026 → Term 1 2026),
     * based on whatever periods actually exist — not an assumed term count.
     * Returns empty if there's no earlier period on record.
     */
    public Optional<AcademicPeriod> findPreviousPeriod(AcademicPeriod period) {
        School school = schoolContextService.getCurrentSchool();
        List<AcademicPeriod> all = academicPeriodRepo.findBySchool(school);
        return all.stream()
                .filter(p -> !p.getId().equals(period.getId()))
                .filter(p -> p.getYear() < period.getYear()
                        || (p.getYear() == period.getYear() && p.getTerm() < period.getTerm()))
                .max(Comparator.comparing(AcademicPeriod::getYear)
                        .thenComparing(AcademicPeriod::getTerm));
    }

    private void closeCurrentPeriod(School school) {
        academicPeriodRepo.findByIsCurrentTrueAndSchool(school)
                .ifPresent(existing -> {
                    existing.setCurrent(false);
                    existing.setStatus(PeriodStatus.CLOSED);
                    academicPeriodRepo.save(existing);
                });
    }
}
