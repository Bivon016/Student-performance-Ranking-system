package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.StudentService;
import com.gradingSystem.GraadingSystem.model.Students;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/students")
public class StudentController {

    @Autowired
    public StudentService studentService;

    @PostMapping("/add")
    @PreAuthorize("isAuthenticated()")
    public Students addStudent(@RequestBody Students students){

        return studentService.addStudent(students);
    }

    @GetMapping("/student/{id}")
    @PreAuthorize("isAuthenticated()")
    public Students viewStudents(@PathVariable Long id){
        return studentService.viewStudent(id);
    }

    @GetMapping("/allstudents")
    @PreAuthorize("isAuthenticated()")
    public List<Students> viewAllStudents(){
        return studentService.viewAllStudents();

    }
    @DeleteMapping("/deleteStud/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','DEPUTY')")
    public String deleteStudent(@PathVariable Long id){
        studentService.deleteStudent(id);

        return "Student deleted succesfully";
    }

    @PutMapping("/update/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL','DEPUTY') or " +
            "@teacherAuthService.isAssignedTo(#students.classId)")
    public Students updateStudents(@PathVariable Long id, @RequestBody Students students) {
        return studentService.updateStudents(id, students);
    }

    @PostMapping("/addBatch")
    @PreAuthorize("hasAnyRole('PRINCIPAL','DEPUTY') or " +
            "@teacherAuthService.isAssignedTo(#classId)")
    public ResponseEntity<List<Students>> addBatch(
            @RequestBody List<Students> students,
            @RequestParam Long classId) {
        return ResponseEntity.ok(studentService.addStudentsBatch(students));
    }
}
