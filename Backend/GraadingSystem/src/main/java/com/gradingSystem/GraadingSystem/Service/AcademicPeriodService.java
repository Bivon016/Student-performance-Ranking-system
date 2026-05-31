package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.AcademicPeriodRepo;
import com.gradingSystem.GraadingSystem.model.AcademicPeriod;
import org.springframework.stereotype.Service;

@Service
public class AcademicPeriodService {

    private final AcademicPeriodRepo academicPeriodRepo;


    public AcademicPeriodService(AcademicPeriodRepo academicPeriodRepo) {
        this.academicPeriodRepo = academicPeriodRepo;

    }

        public AcademicPeriod createAcademicPeriod (AcademicPeriod academicPeriod){
            if (academicPeriodRepo.existsByYearAndTerm(
                    academicPeriod.getYear(), academicPeriod.getTerm())) {
                throw new RuntimeException("Academic period already exists");
            }

            if (academicPeriod.isCurrent()) {
                academicPeriodRepo.findByIsCurrentTrue()
                        .ifPresent(existing -> {
                            existing.setCurrent(false);
                            academicPeriodRepo.save(existing);
                        });
            }

            return academicPeriodRepo.save(academicPeriod);
        }
    public AcademicPeriod getCurrentPeriod() {
        return academicPeriodRepo.findByIsCurrentTrue()
                .orElseThrow(() -> new RuntimeException("No active academic period"));
    }

    public AcademicPeriod setCurrentPeriod(Long id) {
        academicPeriodRepo.findByIsCurrentTrue()
                .ifPresent(existing -> {
                    existing.setCurrent(false);
                    academicPeriodRepo.save(existing);
                });
        AcademicPeriod period = academicPeriodRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Period not found"));
        period.setCurrent(true);
        return academicPeriodRepo.save(period);
    }

    public java.util.List<AcademicPeriod> getAllPeriods() {
        return academicPeriodRepo.findAll();
    }
    }