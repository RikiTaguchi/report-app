package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.entity.ActorType;
import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.service.ReportSocialService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/student/reports/{reportDate}")
public class StudentReportSocialController {

    private final ReportSocialService reportSocialService;

    public StudentReportSocialController(ReportSocialService reportSocialService) {
        this.reportSocialService = reportSocialService;
    }

    @GetMapping("/comments")
    public ResponseEntity<?> listComments(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable LocalDate reportDate) {
        return ResponseEntity.ok(reportSocialService.listComments(principal.getId(), reportDate));
    }

    @GetMapping("/likes")
    public ResponseEntity<?> getLikeStatus(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable LocalDate reportDate) {
        return ResponseEntity.ok(
                reportSocialService.getLikeStatus(principal.getId(), reportDate, ActorType.STUDENT, principal.getId()));
    }

    @PostMapping("/likes")
    public ResponseEntity<?> like(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable LocalDate reportDate) {
        try {
            reportSocialService.likeReport(principal.getId(), reportDate, ActorType.STUDENT, principal.getId());
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/likes")
    public ResponseEntity<?> unlike(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable LocalDate reportDate) {
        try {
            reportSocialService.unlikeReport(principal.getId(), reportDate, ActorType.STUDENT, principal.getId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/images")
    public ResponseEntity<?> listImages(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable LocalDate reportDate) {
        return ResponseEntity.ok(reportSocialService.listImages(principal.getId(), reportDate));
    }

    @PostMapping("/images")
    public ResponseEntity<?> uploadImage(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable LocalDate reportDate,
            @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(reportSocialService.uploadImage(principal.getId(), reportDate, file));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ファイル保存に失敗しました"));
        }
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<?> deleteImage(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable LocalDate reportDate,
            @PathVariable UUID imageId) {
        try {
            reportSocialService.deleteImage(principal.getId(), imageId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
