package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.service.TeacherAccountService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import com.reportapp.reportappbackend.web.dto.PasswordResetRequest;
import com.reportapp.reportappbackend.web.dto.TeacherCreateRequest;
import com.reportapp.reportappbackend.web.dto.TeacherUpdateRequest;
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
@RequestMapping("/api/admin/teachers")
public class AdminTeacherController {

    private final TeacherAccountService teacherAccountService;

    public AdminTeacherController(TeacherAccountService teacherAccountService) {
        this.teacherAccountService = teacherAccountService;
    }

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(teacherAccountService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(teacherAccountService.get(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody @Valid TeacherCreateRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(teacherAccountService.create(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody @Valid TeacherUpdateRequest request) {
        try {
            return ResponseEntity.ok(teacherAccountService.update(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/{id}/password")
    public ResponseEntity<?> resetPassword(
            @PathVariable UUID id, @RequestBody @Valid PasswordResetRequest request) {
        try {
            teacherAccountService.resetPassword(id, request);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        try {
            teacherAccountService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
