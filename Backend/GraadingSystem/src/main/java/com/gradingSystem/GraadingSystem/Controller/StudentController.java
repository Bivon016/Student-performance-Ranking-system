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

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping("/add")
    @PreAuthorize("hasAnyRole('PRINCIPAL', 'DEPUTY') or " +
            "(hasRole('CLASS_TEACHER') and @teacherAuthService.isAssignedTo(#students.classId))")
    public ResponseEntity<Students> addStudent(@RequestBody Students students) {
        return ResponseEntity.ok(studentService.addStudent(students));
    }

    @GetMapping("/student/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Students> viewStudent(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.viewStudent(id));
    }

    @GetMapping("/allstudents")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Students>> viewAllStudents() {
        return ResponseEntity.ok(studentService.viewAllStudents());
    }

    // ✅ Returns ResponseEntity instead of raw String
    @DeleteMapping("/deleteStud/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL', 'DEPUTY')")
    public ResponseEntity<String> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok("Student deleted successfully");
    }


    @PutMapping("/update/{id}")
    @PreAuthorize("hasAnyRole('PRINCIPAL', 'DEPUTY') or " +
            "(hasRole('CLASS_TEACHER') and @teacherAuthService.isAssignedTo(#students.classId))")
    public ResponseEntity<Students> updateStudents(
            @PathVariable Long id,
            @RequestBody Students students) {
        return ResponseEntity.ok(studentService.updateStudents(id, students));
    }

    // ✅ classId derived from students list — no fragile @RequestParam for auth
    @PostMapping("/addBatch")
    @PreAuthorize("hasAnyRole('PRINCIPAL', 'DEPUTY') or " +
            "(hasRole('CLASS_TEACHER') and @teacherAuthService.isAssignedTo(#students.classId))")
    public ResponseEntity<List<Students>> addBatch(@RequestBody List<Students> students) {
        return ResponseEntity.ok(studentService.addStudentsBatch(students));
    }
    @GetMapping("/class/{classId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Students>> viewAllStudentsByClassId(
            @PathVariable Long classId) {

        return ResponseEntity.ok(
                studentService.viewAllStudentsByGrade(classId)
        );
    }
}