package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.service.GoalFormService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import com.reportapp.reportappbackend.web.dto.GoalFormRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teacher/students/{studentId}/goal-forms")
public class TeacherGoalFormController {

    private final GoalFormService goalFormService;

    public TeacherGoalFormController(GoalFormService goalFormService) {
        this.goalFormService = goalFormService;
    }

    @GetMapping("/{goalId}")
    public ResponseEntity<?> get(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable UUID goalId) {
        try {
            return ResponseEntity.ok(goalFormService.get(studentId, goalId, principal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @RequestBody @Valid GoalFormRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(goalFormService.create(studentId, principal.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{goalId}")
    public ResponseEntity<?> update(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable UUID goalId,
            @RequestBody @Valid GoalFormRequest request) {
        try {
            return ResponseEntity.ok(goalFormService.update(studentId, goalId, principal.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
