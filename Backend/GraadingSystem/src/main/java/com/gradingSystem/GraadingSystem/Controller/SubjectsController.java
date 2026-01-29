package com.gradingSystem.GraadingSystem.Controller;
import com.gradingSystem.GraadingSystem.Service.SubjectsService;

import com.gradingSystem.GraadingSystem.Service.SubjectsService;
import com.gradingSystem.GraadingSystem.model.Subjects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/subjects")
public class SubjectsController {

    @Autowired
    private SubjectsService subjectsService;

    @PostMapping("/add")
    public ResponseEntity<Subjects> addSubject(@RequestBody Subjects subjects) {
        Subjects savedSubject = subjectsService.addSubject(subjects);
        return ResponseEntity.ok(savedSubject);
    }

}
