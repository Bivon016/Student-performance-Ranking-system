package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.TeachersService;
import com.gradingSystem.GraadingSystem.model.Teachers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/teachers")
public class TeacherController {

    @Autowired
    public TeachersService teachersService;

    @PostMapping("/add")
    public Teachers addTeacher(@RequestBody Teachers teacher) {
        return teachersService.addTeacher(teacher);
    }

    // Updated to use array instead of List
    @GetMapping("/teachers")
    public Teachers[] viewAllTeachers() {
        return teachersService.viewAllTeachers();
    }

    @DeleteMapping("/delete/{id}")
    public String deleteTeacher(@PathVariable Long id) {
        teachersService.deleteTeacher(id);
        return "Teacher deleted successfully";
    }
}
