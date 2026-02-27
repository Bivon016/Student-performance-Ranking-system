package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.ClassRepo;
import com.gradingSystem.GraadingSystem.dto.ClassDTO;
import com.gradingSystem.GraadingSystem.model.Class;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClassService {

    @Autowired
    private ClassRepo classRepo;

    // ── Create ────────────────────────────────────────────────────────────────
    public ClassDTO createClass(Integer formNumber, String stream, Integer year, String className) {
        if (classRepo.existsByFormNumberAndStreamAndYear(formNumber, stream, year)) {
            throw new RuntimeException(
                    "Class 'Form " + formNumber + " " + stream + " - " + year + "' already exists."
            );
        }
        Class newClass = new Class(formNumber, stream, year, className);
        return toDTO(classRepo.save(newClass));
    }

    // ── Get All ───────────────────────────────────────────────────────────────
    public List<ClassDTO> getAllClasses() {
        return classRepo.findAll().stream().map(this::toDTO).toList();
    }

    // ── Get by Form ───────────────────────────────────────────────────────────
    public List<ClassDTO> getClassesByForm(Integer formNumber) {
        return classRepo.findByFormNumber(formNumber).stream().map(this::toDTO).toList();
    }

    // ── Get by Year ───────────────────────────────────────────────────────────
    public List<ClassDTO> getClassesByYear(Integer year) {
        return classRepo.findByYear(year).stream().map(this::toDTO).toList();
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    public void deleteClass(Long classId) {
        Class cls = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found: " + classId));
        classRepo.delete(cls);
    }

    // ── Update ────────────────────────────────────────────────────────────────
    public ClassDTO updateClass(Long classId, Integer formNumber, String stream, Integer year, String className) {
        Class cls = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found: " + classId));
        cls.setFormNumber(formNumber);
        cls.setStream(stream);
        cls.setYear(year);
        cls.setClassName(className);
        return toDTO(classRepo.save(cls));
    }

    // ── Converter ─────────────────────────────────────────────────────────────
    private ClassDTO toDTO(Class cls) {
        return new ClassDTO(
                cls.getClassId(),
                cls.getClassName(),
                cls.getFormNumber(),
                cls.getStream(),
                cls.getYear()
        );
    }
}