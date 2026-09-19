package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.entity.ActorType;
import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.service.ReportSocialService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import com.reportapp.reportappbackend.web.dto.ReportCommentRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teacher/students/{studentId}/reports/{reportDate}")
public class TeacherReportSocialController {

    private final ReportSocialService reportSocialService;

    public TeacherReportSocialController(ReportSocialService reportSocialService) {
        this.reportSocialService = reportSocialService;
    }

    @GetMapping("/comments")
    public ResponseEntity<?> listComments(@PathVariable UUID studentId, @PathVariable LocalDate reportDate) {
        return ResponseEntity.ok(reportSocialService.listCommentsForTeacher(studentId, reportDate));
    }

    @PostMapping("/comments")
    public ResponseEntity<?> createComment(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable LocalDate reportDate,
            @RequestBody @Valid ReportCommentRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(reportSocialService.createCommentAsTeacher(
                            studentId, reportDate, principal.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<?> updateComment(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable LocalDate reportDate,
            @PathVariable UUID commentId,
            @RequestBody @Valid ReportCommentRequest request) {
        try {
            return ResponseEntity.ok(reportSocialService.updateCommentAsAuthor(
                    commentId, ActorType.TEACHER, principal.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable LocalDate reportDate,
            @PathVariable UUID commentId) {
        try {
            reportSocialService.deleteCommentAsAuthor(commentId, ActorType.TEACHER, principal.getId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/likes")
    public ResponseEntity<?> getLikeStatus(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable LocalDate reportDate) {
        return ResponseEntity.ok(
                reportSocialService.getLikeStatus(studentId, reportDate, ActorType.TEACHER, principal.getId()));
    }

    @PostMapping("/likes")
    public ResponseEntity<?> like(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable LocalDate reportDate) {
        try {
            reportSocialService.likeReport(studentId, reportDate, ActorType.TEACHER, principal.getId());
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/likes")
    public ResponseEntity<?> unlike(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable LocalDate reportDate) {
        try {
            reportSocialService.unlikeReport(studentId, reportDate, ActorType.TEACHER, principal.getId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/images")
    public ResponseEntity<?> listImages(@PathVariable UUID studentId, @PathVariable LocalDate reportDate) {
        return ResponseEntity.ok(reportSocialService.listImagesForTeacher(studentId, reportDate));
    }
}
