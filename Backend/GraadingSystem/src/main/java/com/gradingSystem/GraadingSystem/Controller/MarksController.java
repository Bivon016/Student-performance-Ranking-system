package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.MarksService;
import com.gradingSystem.GraadingSystem.dto.MarksBatchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/marks")
public class MarksController {

    @Autowired
    private  MarksService marksService;

    @PostMapping("/add")
    public ResponseEntity<?> addMarksBatch(
            @RequestBody MarksBatchRequest request
    ) {
        return ResponseEntity.ok(
                marksService.addMarksForManyStudents(request)
        );
    }
}
