package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.ClassRepo;
import com.gradingSystem.GraadingSystem.dto.ClassDTO;
import com.gradingSystem.GraadingSystem.model.Classes;
import com.gradingSystem.GraadingSystem.model.School;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class ClassService {

    @Autowired private ClassRepo classRepo;
    @Autowired private SchoolContextService schoolContext;

    public ClassDTO createClass(Integer formNumber, String stream, Integer year, String className) {
        School school = schoolContext.getCurrentSchool();
        if (classRepo.existsByFormNumberAndStreamAndYearAndSchool(formNumber, stream, year, school)) {
            throw new RuntimeException(
                    "Classes 'Form " + formNumber + " " + stream + " - " + year + "' already exists."
            );
        }
        Classes newClasses = new Classes(formNumber, stream, year, className);
        newClasses.setSchool(school);
        return toDTO(classRepo.save(newClasses));
    }

    public List<ClassDTO> getAllClasses() {
        School school = schoolContext.getCurrentSchool();
        return classRepo.findBySchool(school).stream().map(this::toDTO).toList();
    }

    public List<ClassDTO> getClassesByForm(Integer formNumber) {
        School school = schoolContext.getCurrentSchool();
        return classRepo.findBySchoolAndFormNumber(school, formNumber)
                .stream().map(this::toDTO).toList();
    }

    public List<ClassDTO> getClassesByYear(Integer year) {
        School school = schoolContext.getCurrentSchool();
        return classRepo.findBySchoolAndYear(school, year)
                .stream().map(this::toDTO).toList();
    }

    public void deleteClass(Long classId) {
        Classes cls = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Classes not found: " + classId));
        classRepo.delete(cls);
    }

    public ClassDTO updateClass(Long classId, Integer formNumber, String stream, Integer year, String className) {
        Classes cls = classRepo.findById(classId)
                .orElseThrow(() -> new RuntimeException("Classes not found: " + classId));
        cls.setFormNumber(formNumber);
        cls.setStream(stream);
        cls.setYear(year);
        cls.setClassName(className);
        return toDTO(classRepo.save(cls));
    }

    private ClassDTO toDTO(Classes cls) {
        return new ClassDTO(
                cls.getClassId(),
                cls.getClassName(),
                cls.getFormNumber(),
                cls.getStream(),
                cls.getYear()
        );
    }
}