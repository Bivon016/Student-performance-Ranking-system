package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.SubjectsService;
import com.gradingSystem.GraadingSystem.model.Subjects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/subjects")
public class SubjectsController {

    @Autowired
    private SubjectsService subjectsService;

    // ---------- ADD SUBJECT ----------
    @PostMapping("/addSubjects")
    public Subjects addSubject(@RequestBody Subjects subject) {
        return subjectsService.addSubject(subject);
    }

    // ---------- VIEW SINGLE SUBJECT ----------
    @GetMapping("/{id}")
    public Subjects viewSubject(@PathVariable Long id) {
        return subjectsService.viewSubject(id);
    }

    // ---------- VIEW ALL SUBJECTS ----------
    @GetMapping("/allSubjects")
    public List<Subjects> viewAllSubjects() {
        return subjectsService.viewAllSubjects();
    }

    // ---------- DELETE SUBJECT ----------
    @DeleteMapping("/delete/{id}")
    public String deleteSubject(@PathVariable Long id) {
        subjectsService.deleteSubject(id);
        return "Subject deleted successfully";
    }

    // ---------- UPDATE SUBJECT ----------
    @PutMapping("/update/{id}")
    public Subjects updateSubject(@PathVariable Long id, @RequestBody Subjects subject) {
        return subjectsService.updateSubject(id, subject);
    }
}
