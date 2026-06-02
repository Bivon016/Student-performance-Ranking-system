package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.SchoolRepo;
import com.gradingSystem.GraadingSystem.model.School;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SchoolService {

    private final SchoolRepo schoolRepo;

    public SchoolService(SchoolRepo schoolRepo) {
        this.schoolRepo = schoolRepo;
    }

    public School registerSchool(School school) {

        // Basic validation
        if (school.getSchoolName() == null || school.getSchoolName().isBlank()) {
            throw new IllegalArgumentException("School name is required");
        }

        if (school.getSchoolCode() == null || school.getSchoolCode().isBlank()) {
            throw new IllegalArgumentException("School code is required");
        }

        // Uniqueness check
        if (schoolRepo.existsBySchoolCode(school.getSchoolCode())) {
            throw new IllegalArgumentException("School code already exists");
        }

        if (schoolRepo.existsByEmail(school.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        school.setActive(true);

        return schoolRepo.save(school);
    }

    public School getSchoolById(Long schoolId) {
        return schoolRepo.findById(schoolId)
                .orElseThrow(() -> new EntityNotFoundException("School not found"));
    }

    public List<School> getAllSchools() {
        return schoolRepo.findAll();
    }

    public School getBySchoolCode(String schoolCode) {
        return schoolRepo.findBySchoolCode(schoolCode)
                .orElseThrow(() -> new EntityNotFoundException("School not found"));
    }

    public School updateSchool(Long schoolId, School updatedSchool) {

        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new EntityNotFoundException("School not found"));

        if (updatedSchool.getSchoolName() != null)
            school.setSchoolName(updatedSchool.getSchoolName());

        if (updatedSchool.getSchoolLogo() != null)
            school.setSchoolLogo(updatedSchool.getSchoolLogo());

        if (updatedSchool.getSchoolType() != null)
            school.setSchoolType(updatedSchool.getSchoolType());

        if (updatedSchool.getCity() != null)
            school.setCity(updatedSchool.getCity());

        if (updatedSchool.getCountry() != null)
            school.setCountry(updatedSchool.getCountry());

        if (updatedSchool.getPostalAddress() != null)
            school.setPostalAddress(updatedSchool.getPostalAddress());

        if (updatedSchool.getPhoneNumber() != null)
            school.setPhoneNumber(updatedSchool.getPhoneNumber());

        if (updatedSchool.getEmail() != null)
            school.setEmail(updatedSchool.getEmail());

        if (updatedSchool.getMotto() != null)
            school.setMotto(updatedSchool.getMotto());

        return schoolRepo.save(school);
    }

    // =========================
    // DELETE SCHOOL (SOFT DELETE READY OPTION)
    // =========================
    public void deleteSchool(Long schoolId) {

        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new EntityNotFoundException("School not found"));
//
//        // OPTION A: hard delete
//        schoolRepo.delete(school);

        // OPTION B (recommended for real systems):
         school.setActive(false);
         schoolRepo.save(school);
    }
}