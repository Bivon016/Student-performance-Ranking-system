package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.StudentService;
import com.gradingSystem.GraadingSystem.model.Students;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/students")
public class StudentController {

    @Autowired
    public StudentService studentService;

    @PostMapping("/add")
    public Students addStudent(@RequestBody Students students){

        return studentService.addStudent(students);
    }

    @GetMapping("/student/{id}")
    public Students viewStudents(@PathVariable Long id){
        return studentService.viewStudent(id);
    }

    @GetMapping("/allstudents")
    public List<Students> viewAllStudents(){
        return studentService.viewAllStudents();

    }
    @DeleteMapping("/deleteStud/{id}")
    public String deleteStudent(@PathVariable Long id){
        studentService.deleteStudent(id);

        return "Student deleted succesfully";
    }

    @PutMapping("/update/{id}")
    public Students updateStudents(@PathVariable Long id, @RequestBody Students students){
        return studentService.updateStudents(id, students);
    }

    @PostMapping("/addBatch")
    public ResponseEntity<List<Students>> addBatch(@RequestBody List<Students> students) {
        return ResponseEntity.ok(studentService.addStudentsBatch(students));
    }
}
