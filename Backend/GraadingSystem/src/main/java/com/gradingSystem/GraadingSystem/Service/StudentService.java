package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.StudentRepo;
import com.gradingSystem.GraadingSystem.model.Students;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class StudentService {

    @Autowired
    public StudentRepo studentRepo;

    public Students addStudent(Students students) {
        return studentRepo.save(students);
    }

    public Students viewStudent(Long id) {
        return studentRepo.findById(id).orElse(null);
    }

    public List<Students> viewAllStudents() {
        return studentRepo.findAll();
    }

    public void deleteStudent(Long id) {
        Students student = studentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        studentRepo.delete(student);
    }

    public Students updateStudents(Long id, Students newData) {
        Students student = studentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student does not exist"));

        student.setFirstName(newData.getFirstName());
        student.setSecondName(newData.getSecondName());
        student.setGender(newData.getGender());
        student.setClassId(newData.getClassId());

        return studentRepo.save(student);
    }
    public List<Students> addStudentsBatch(List<Students> students) {
        return studentRepo.saveAll(students);
    }
}