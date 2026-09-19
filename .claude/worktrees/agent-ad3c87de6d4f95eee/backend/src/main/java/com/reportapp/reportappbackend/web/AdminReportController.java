package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.service.DailyReportService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/students/{studentId}/reports")
public class AdminReportController {

    private final DailyReportService dailyReportService;

    public AdminReportController(DailyReportService dailyReportService) {
        this.dailyReportService = dailyReportService;
    }

    @GetMapping
    public ResponseEntity<?> list(@PathVariable UUID studentId) {
        return ResponseEntity.ok(dailyReportService.listReports(studentId));
    }

    @GetMapping("/{reportDate}")
    public ResponseEntity<?> get(@PathVariable UUID studentId, @PathVariable LocalDate reportDate) {
        return dailyReportService
                .getReport(studentId, reportDate)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("日報が見つかりません")));
    }

    @DeleteMapping("/{reportDate}")
    public ResponseEntity<?> delete(@PathVariable UUID studentId, @PathVariable LocalDate reportDate) {
        try {
            dailyReportService.deleteReport(studentId, reportDate);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
