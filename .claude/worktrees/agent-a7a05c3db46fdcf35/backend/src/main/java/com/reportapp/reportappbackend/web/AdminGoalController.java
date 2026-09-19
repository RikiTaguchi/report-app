package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.service.GoalProgressService;
import com.reportapp.reportappbackend.service.GoalService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import com.reportapp.reportappbackend.web.dto.GoalCreateRequest;
import com.reportapp.reportappbackend.web.dto.GoalProgressCreateRequest;
import com.reportapp.reportappbackend.web.dto.GoalProgressUpdateRequest;
import com.reportapp.reportappbackend.web.dto.GoalUpdateRequest;
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
@RequestMapping("/api/admin/students/{studentId}/goals")
public class AdminGoalController {

    private final GoalService goalService;
    private final GoalProgressService goalProgressService;

    public AdminGoalController(GoalService goalService, GoalProgressService goalProgressService) {
        this.goalService = goalService;
        this.goalProgressService = goalProgressService;
    }

    @GetMapping
    public ResponseEntity<?> list(@PathVariable UUID studentId) {
        return ResponseEntity.ok(goalService.list(studentId));
    }

    @GetMapping("/{goalId}")
    public ResponseEntity<?> get(@PathVariable UUID studentId, @PathVariable UUID goalId) {
        try {
            return ResponseEntity.ok(goalService.get(goalId, studentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@PathVariable UUID studentId, @RequestBody @Valid GoalCreateRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(goalService.create(studentId, null, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{goalId}")
    public ResponseEntity<?> update(
            @PathVariable UUID studentId, @PathVariable UUID goalId, @RequestBody @Valid GoalUpdateRequest request) {
        try {
            return ResponseEntity.ok(goalService.update(goalId, studentId, null, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<?> delete(@PathVariable UUID studentId, @PathVariable UUID goalId) {
        try {
            goalService.delete(goalId, studentId, null);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{goalId}/progresses")
    public ResponseEntity<?> listProgresses(@PathVariable UUID studentId, @PathVariable UUID goalId) {
        try {
            return ResponseEntity.ok(goalProgressService.list(goalId, studentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/{goalId}/progresses")
    public ResponseEntity<?> createProgress(
            @PathVariable UUID studentId,
            @PathVariable UUID goalId,
            @RequestBody @Valid GoalProgressCreateRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(goalProgressService.create(goalId, studentId, null, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{goalId}/progresses/{progressId}")
    public ResponseEntity<?> updateProgress(
            @PathVariable UUID studentId,
            @PathVariable UUID goalId,
            @PathVariable UUID progressId,
            @RequestBody @Valid GoalProgressUpdateRequest request) {
        try {
            return ResponseEntity.ok(goalProgressService.update(progressId, goalId, studentId, null, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{goalId}/progresses/{progressId}")
    public ResponseEntity<?> deleteProgress(
            @PathVariable UUID studentId, @PathVariable UUID goalId, @PathVariable UUID progressId) {
        try {
            goalProgressService.delete(progressId, goalId, studentId, null);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
