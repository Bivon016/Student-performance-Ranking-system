package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.ClassService;
import com.gradingSystem.GraadingSystem.dto.ClassDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/classes")
@CrossOrigin(origins = "http://localhost:5173")
public class ClassController {

    @Autowired
    private ClassService classService;

    // GET /classes/all
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/all")
    public ResponseEntity<List<ClassDTO>> getAllClasses() {
        return ResponseEntity.ok(classService.getAllClasses());
    }

    // GET /classes/form/{formNumber}
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/form/{formNumber}")
    public ResponseEntity<List<ClassDTO>> getByForm(@PathVariable Integer formNumber) {
        return ResponseEntity.ok(classService.getClassesByForm(formNumber));
    }

    // GET /classes/year/{year}
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/year/{year}")
    public ResponseEntity<List<ClassDTO>> getByYear(@PathVariable Integer year) {
        return ResponseEntity.ok(classService.getClassesByYear(year));
    }

    // POST /classes/create
    @PreAuthorize("hasRole('PRINCIPAL')")
    @PostMapping("/create")
    public ResponseEntity<?> createClass(@RequestBody Map<String, Object> body) {
        try {
            Integer formNumber = (Integer) body.get("formNumber");
            String  stream     = (String)  body.get("stream");
            Integer year       = (Integer) body.get("year");
            String  className  = (String)  body.get("className");
            return ResponseEntity.ok(classService.createClass(formNumber, stream, year, className));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /classes/update/{classId}
    @PreAuthorize("hasRole('PRINCIPAL')")
    @PutMapping("/update/{classId}")
    public ResponseEntity<?> updateClass(
            @PathVariable Long classId,
            @RequestBody Map<String, Object> body) {
        try {
            Integer formNumber = (Integer) body.get("formNumber");
            String  stream     = (String)  body.get("stream");
            Integer year       = (Integer) body.get("year");
            String  className  = (String)  body.get("className");
            return ResponseEntity.ok(classService.updateClass(classId, formNumber, stream, year, className));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /classes/delete/{classId}
    @PreAuthorize("hasRole('PRINCIPAL')")
    @DeleteMapping("/delete/{classId}")
    public ResponseEntity<String> deleteClass(@PathVariable Long classId) {
        try {
            classService.deleteClass(classId);
            return ResponseEntity.ok("Classes deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}