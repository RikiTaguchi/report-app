package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.service.StudentAccountService;
import com.reportapp.reportappbackend.service.StudentDashboardService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import com.reportapp.reportappbackend.web.dto.PasswordResetRequest;
import com.reportapp.reportappbackend.web.dto.StudentCreateRequest;
import com.reportapp.reportappbackend.web.dto.StudentUpdateRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/students")
public class AdminStudentController {

    private final StudentAccountService studentAccountService;
    private final StudentDashboardService studentDashboardService;

    public AdminStudentController(
            StudentAccountService studentAccountService, StudentDashboardService studentDashboardService) {
        this.studentAccountService = studentAccountService;
        this.studentDashboardService = studentDashboardService;
    }

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(studentAccountService.list());
    }

    @GetMapping("/{id}/dashboard")
    public ResponseEntity<?> dashboard(@PathVariable UUID id) {
        return ResponseEntity.ok(studentDashboardService.getDashboard(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(studentAccountService.get(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody @Valid StudentCreateRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(studentAccountService.create(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody @Valid StudentUpdateRequest request) {
        try {
            return ResponseEntity.ok(studentAccountService.update(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/{id}/password")
    public ResponseEntity<?> resetPassword(
            @PathVariable UUID id, @RequestBody @Valid PasswordResetRequest request) {
        try {
            studentAccountService.resetPassword(id, request);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        try {
            studentAccountService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
