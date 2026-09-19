package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.mapper.SubjectMapper;
import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.service.DailyReportService;
import com.reportapp.reportappbackend.service.ReportItemDefinitionService;
import com.reportapp.reportappbackend.web.dto.DailyReportSubmitRequest;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import com.reportapp.reportappbackend.web.dto.SubjectResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
public class StudentReportController {

    private final DailyReportService dailyReportService;
    private final ReportItemDefinitionService reportItemDefinitionService;
    private final SubjectMapper subjectMapper;

    public StudentReportController(
            DailyReportService dailyReportService,
            ReportItemDefinitionService reportItemDefinitionService,
            SubjectMapper subjectMapper) {
        this.dailyReportService = dailyReportService;
        this.reportItemDefinitionService = reportItemDefinitionService;
        this.subjectMapper = subjectMapper;
    }

    @PutMapping("/reports/{reportDate}")
    public ResponseEntity<?> save(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable LocalDate reportDate,
            @RequestBody @Valid DailyReportSubmitRequest request,
            @RequestParam(defaultValue = "false") boolean createOnly) {
        try {
            return ResponseEntity.ok(
                    dailyReportService.saveReport(principal.getId(), reportDate, request, createOnly));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/reports/{reportDate}")
    public ResponseEntity<?> get(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable LocalDate reportDate) {
        return dailyReportService
                .getReport(principal.getId(), reportDate)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("日報が見つかりません")));
    }

    @GetMapping("/reports")
    public ResponseEntity<?> list(@AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.ok(dailyReportService.listSubmittedReports(principal.getId()));
    }

    @DeleteMapping("/reports/{reportDate}")
    public ResponseEntity<?> delete(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable LocalDate reportDate) {
        try {
            dailyReportService.deleteReport(principal.getId(), reportDate);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/report-item-definitions")
    public ResponseEntity<?> listItemDefinitions(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate reportDate) {
        return ResponseEntity.ok(reportItemDefinitionService.listApplicable(principal.getId(), reportDate));
    }

    @GetMapping("/subjects")
    public ResponseEntity<?> listSubjects() {
        List<SubjectResponse> response = subjectMapper.findAll().stream()
                .map(subject -> new SubjectResponse(subject.getId(), subject.getName(), subject.getDisplayOrder()))
                .toList();
        return ResponseEntity.ok(response);
    }
}
