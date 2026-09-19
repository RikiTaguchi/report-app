package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.service.StudentAccountService;
import com.reportapp.reportappbackend.service.StudentDashboardService;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teacher/students")
public class TeacherStudentController {

    private final StudentAccountService studentAccountService;
    private final StudentDashboardService studentDashboardService;

    public TeacherStudentController(
            StudentAccountService studentAccountService, StudentDashboardService studentDashboardService) {
        this.studentAccountService = studentAccountService;
        this.studentDashboardService = studentDashboardService;
    }

    @GetMapping
    public ResponseEntity<?> listOwn(@AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.ok(studentAccountService.listByTeacherId(principal.getId()));
    }

    @GetMapping("/all")
    public ResponseEntity<?> listAll() {
        return ResponseEntity.ok(studentAccountService.list());
    }

    @GetMapping("/{studentId}/dashboard")
    public ResponseEntity<?> dashboard(@PathVariable UUID studentId) {
        return ResponseEntity.ok(studentDashboardService.getDashboard(studentId));
    }
}
