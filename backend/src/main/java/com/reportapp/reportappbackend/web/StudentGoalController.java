package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.service.GoalProgressService;
import com.reportapp.reportappbackend.service.GoalService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/goals")
public class StudentGoalController {

    private final GoalService goalService;
    private final GoalProgressService goalProgressService;

    public StudentGoalController(GoalService goalService, GoalProgressService goalProgressService) {
        this.goalService = goalService;
        this.goalProgressService = goalProgressService;
    }

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.ok(goalService.list(principal.getId()));
    }

    @GetMapping("/{goalId}/progresses")
    public ResponseEntity<?> listProgresses(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable UUID goalId) {
        try {
            return ResponseEntity.ok(goalProgressService.list(goalId, principal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
