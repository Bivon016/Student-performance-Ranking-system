package com.gradingSystem.GraadingSystem.Controller;

import com.gradingSystem.GraadingSystem.Service.AcademicPeriodService;
import com.gradingSystem.GraadingSystem.model.AcademicPeriod;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/period")
public class AcademicPeriodController {

    private final AcademicPeriodService academicPeriodService;

    public AcademicPeriodController(AcademicPeriodService academicPeriodService) {
        this.academicPeriodService = academicPeriodService;
    }
    @PostMapping("/newPeriod")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')")
      public AcademicPeriod createAcademicPeriod(@RequestBody AcademicPeriod academicPeriod) {
        return academicPeriodService.createAcademicPeriod(academicPeriod);
    }

    @GetMapping("/viewPeriod")
    @PreAuthorize("isAuthenticated()")
    public AcademicPeriod getAcademicPeriod() {
        return academicPeriodService.getCurrentPeriod();
    }

    @PutMapping("/{id}/setCurrent")
    @PreAuthorize("hasAuthority('ROLE_PRINCIPAL')") // ✅ was hasRole
    public AcademicPeriod setCurrentPeriod(@PathVariable Long id) {
        return academicPeriodService.setCurrentPeriod(id);
    }

    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public List<AcademicPeriod> getAllPeriods() {
        return academicPeriodService.getAllPeriods();
    }


}
