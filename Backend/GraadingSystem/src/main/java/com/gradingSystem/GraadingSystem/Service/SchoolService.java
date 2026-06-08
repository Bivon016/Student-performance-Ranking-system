package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.SchoolRepo;
import com.gradingSystem.GraadingSystem.Repository.UsersRepo;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.User;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class SchoolService {

    private final SchoolRepo schoolRepo;
    private SchoolContextService schoolContextService;
    private final UsersRepo usersRepo;
    private final FileStorageService fileStorageService;

    public SchoolService(SchoolRepo schoolRepo,
                         SchoolContextService schoolContextService,
                         UsersRepo usersRepo,
                         FileStorageService fileStorageService) {
        this.schoolRepo = schoolRepo;
        this.schoolContextService = schoolContextService;
        this.usersRepo = usersRepo;
        this.fileStorageService = fileStorageService;
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

    public School updateSchool(Long id, School updated) {
        School existing = getSchoolById(id);
        existing.setSchoolName(updated.getSchoolName());
        existing.setSchoolCode(updated.getSchoolCode());
        existing.setSchoolType(updated.getSchoolType());
        existing.setCity(updated.getCity());
        existing.setCountry(updated.getCountry());
        existing.setPostalAddress(updated.getPostalAddress());
        existing.setPhoneNumber(updated.getPhoneNumber());
        existing.setEmail(updated.getEmail());
        existing.setMotto(updated.getMotto());
        applySchoolLogo(existing, updated.getSchoolLogo());
        // active is NOT updated — preserves existing value
        return schoolRepo.save(existing);
    }

    public School uploadSchoolLogo(Long schoolId, MultipartFile file) {
        School school = getSchoolById(schoolId);
        String previous = school.getSchoolLogo();
        String storedPath = fileStorageService.storeSchoolLogo(schoolId, file);
        school.setSchoolLogo(storedPath);
        School saved = schoolRepo.save(school);
        if (fileStorageService.isStoredPath(previous) && !previous.equals(storedPath)) {
            fileStorageService.deleteStoredFile(previous);
        }
        return saved;
    }

    public School removeSchoolLogo(Long schoolId) {
        School school = getSchoolById(schoolId);
        String previous = school.getSchoolLogo();
        school.setSchoolLogo(null);
        School saved = schoolRepo.save(school);
        fileStorageService.deleteStoredFile(previous);
        return saved;
    }

    private void applySchoolLogo(School existing, String logoValue) {
        if (logoValue == null || logoValue.isBlank()) {
            fileStorageService.deleteStoredFile(existing.getSchoolLogo());
            existing.setSchoolLogo(null);
            return;
        }
        if (logoValue.startsWith("data:")) {
            throw new IllegalArgumentException("Logo must be uploaded as a file, not embedded base64");
        }
        if (!logoValue.startsWith("/uploads/") && !logoValue.startsWith("http://") && !logoValue.startsWith("https://")) {
            throw new IllegalArgumentException("Invalid logo URL");
        }
        String previous = existing.getSchoolLogo();
        existing.setSchoolLogo(logoValue.trim());
        if (fileStorageService.isStoredPath(previous) && !previous.equals(existing.getSchoolLogo())) {
            fileStorageService.deleteStoredFile(previous);
        }
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

    public School getCurrentSchoolForUser() {

        return schoolContextService.getCurrentSchool();
    }
    public School registerSchool(School school, User creator) {
        if (school.getSchoolName() == null || school.getSchoolName().isBlank())
            throw new IllegalArgumentException("School name is required");
        if (school.getSchoolCode() == null || school.getSchoolCode().isBlank())
            throw new IllegalArgumentException("School code is required");
        if (schoolRepo.existsBySchoolCode(school.getSchoolCode()))
            throw new IllegalArgumentException("School code already exists");
        if (schoolRepo.existsByEmail(school.getEmail()))
            throw new IllegalArgumentException("Email already in use");

        school.setActive(true);
        School saved = schoolRepo.save(school);

        // ✅ Auto-link the creating user to this school
        creator.setSchool(saved);
        usersRepo.save(creator);

        return saved;
    }
}
