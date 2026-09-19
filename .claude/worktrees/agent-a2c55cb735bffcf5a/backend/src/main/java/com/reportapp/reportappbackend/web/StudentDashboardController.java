package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.service.StudentDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/dashboard")
public class StudentDashboardController {

    private final StudentDashboardService studentDashboardService;

    public StudentDashboardController(StudentDashboardService studentDashboardService) {
        this.studentDashboardService = studentDashboardService;
    }

    @GetMapping
    public ResponseEntity<?> get(@AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.ok(studentDashboardService.getDashboard(principal.getId()));
    }
}
