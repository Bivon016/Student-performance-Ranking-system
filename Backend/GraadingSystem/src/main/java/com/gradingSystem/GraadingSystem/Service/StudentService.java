package com.gradingSystem.GraadingSystem.Service;

import com.gradingSystem.GraadingSystem.Repository.StudentRepo;
import com.gradingSystem.GraadingSystem.model.School;
import com.gradingSystem.GraadingSystem.model.Students;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.gradingSystem.GraadingSystem.Repository.ClassRepo;
import org.springframework.web.server.ResponseStatusException;
import com.gradingSystem.GraadingSystem.Repository.Marksrepo;
import jakarta.transaction.Transactional;

import java.util.List;

@Service
public class StudentService {

    @Autowired
    public StudentRepo studentRepo;

    @Autowired
    private Marksrepo marksrepo;

    @Autowired
    public ClassRepo classRepo;
    @Autowired
    private SchoolContextService schoolContextService;

    public Students addStudent(Students students) {
        School school = schoolContextService.getCurrentSchool();
        students.setSchool(school);

        return studentRepo.save(students);
    }
    public Students viewStudent(Long id) {

        School school = schoolContextService.getCurrentSchool();

        return studentRepo.findByIdAndSchool(id, school)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Student not found"
                        )
                );
    }


        public List<Students> viewAllStudents() {

            School school = schoolContextService.getCurrentSchool();

            return studentRepo.findBySchool(school);
        }

    public List<Students> viewAllStudentsByGrade(Long classId) {

        School school = schoolContextService.getCurrentSchool();
        classRepo.findByClassIdAndSchool(classId, school)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Class not found"
                        )
                );

        return studentRepo.findBySchoolAndClassId(school,classId);
    }
    @Transactional
    public void deleteStudent(Long id) {
        School school = schoolContextService.getCurrentSchool();
        Students student = studentRepo.findByIdAndSchool(id, school)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        marksrepo.deleteByStudent_Id(id);
        studentRepo.delete(student);
    }

    public Students updateStudents(Long id, Students newData) {
        School school = schoolContextService.getCurrentSchool();
        Students student = studentRepo.findByIdAndSchool(id,school)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student does not exist"));

        student.setFirstName(newData.getFirstName());
        student.setSecondName(newData.getSecondName());
        student.setGender(newData.getGender());
        student.setClassId(newData.getClassId());

        return studentRepo.save(student);
    }
    public List<Students> addStudentsBatch(List<Students> students) {
        School school = schoolContextService.getCurrentSchool();
        students.forEach(student -> {student.setSchool(school);});
        return studentRepo.saveAll(students);
    }
}