package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.service.ReportSocialService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/students/{studentId}/reports/{reportDate}")
public class AdminReportSocialController {

    private final ReportSocialService reportSocialService;

    public AdminReportSocialController(ReportSocialService reportSocialService) {
        this.reportSocialService = reportSocialService;
    }

    @GetMapping("/comments")
    public ResponseEntity<?> listComments(@PathVariable UUID studentId, @PathVariable LocalDate reportDate) {
        return ResponseEntity.ok(reportSocialService.listComments(studentId, reportDate));
    }

    @GetMapping("/images")
    public ResponseEntity<?> listImages(@PathVariable UUID studentId, @PathVariable LocalDate reportDate) {
        return ResponseEntity.ok(reportSocialService.listImages(studentId, reportDate));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable UUID studentId, @PathVariable LocalDate reportDate, @PathVariable UUID commentId) {
        try {
            reportSocialService.deleteCommentAsAdmin(commentId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
