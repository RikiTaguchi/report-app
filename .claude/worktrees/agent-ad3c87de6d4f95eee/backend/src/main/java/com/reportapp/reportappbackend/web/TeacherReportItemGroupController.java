package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.service.ReportItemDefinitionService;
import com.reportapp.reportappbackend.service.ReportItemGroupService;
import com.reportapp.reportappbackend.service.ReportItemSubtitleService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import com.reportapp.reportappbackend.web.dto.ReportItemDefinitionCreateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemDefinitionUpdateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemGroupCreateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemReorderRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemSubtitleCreateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemSubtitleUpdateRequest;
import jakarta.validation.Valid;
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
@RequestMapping("/api/teacher/students/{studentId}/report-item-groups")
public class TeacherReportItemGroupController {

    private final ReportItemGroupService reportItemGroupService;
    private final ReportItemSubtitleService reportItemSubtitleService;
    private final ReportItemDefinitionService reportItemDefinitionService;

    public TeacherReportItemGroupController(
            ReportItemGroupService reportItemGroupService,
            ReportItemSubtitleService reportItemSubtitleService,
            ReportItemDefinitionService reportItemDefinitionService) {
        this.reportItemGroupService = reportItemGroupService;
        this.reportItemSubtitleService = reportItemSubtitleService;
        this.reportItemDefinitionService = reportItemDefinitionService;
    }

    @GetMapping
    public ResponseEntity<?> listGroups(@PathVariable UUID studentId) {
        return ResponseEntity.ok(reportItemGroupService.list(studentId));
    }

    @PostMapping
    public ResponseEntity<?> createGroup(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @RequestBody @Valid ReportItemGroupCreateRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(reportItemGroupService.create(studentId, principal.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable UUID groupId) {
        try {
            reportItemGroupService.delete(groupId, studentId, principal.getId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/subtitles")
    public ResponseEntity<?> listSubtitles(@PathVariable UUID studentId, @PathVariable UUID groupId) {
        try {
            return ResponseEntity.ok(reportItemSubtitleService.list(groupId, studentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/subtitles")
    public ResponseEntity<?> createSubtitle(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable UUID groupId,
            @RequestBody @Valid ReportItemSubtitleCreateRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(reportItemSubtitleService.create(groupId, studentId, principal.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{groupId}/subtitles/{subtitleId}")
    public ResponseEntity<?> updateSubtitle(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable UUID groupId,
            @PathVariable UUID subtitleId,
            @RequestBody @Valid ReportItemSubtitleUpdateRequest request) {
        try {
            return ResponseEntity.ok(
                    reportItemSubtitleService.update(subtitleId, groupId, studentId, principal.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{groupId}/subtitles/{subtitleId}")
    public ResponseEntity<?> deleteSubtitle(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable UUID groupId,
            @PathVariable UUID subtitleId) {
        try {
            reportItemSubtitleService.delete(subtitleId, groupId, studentId, principal.getId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/subtitles/{subtitleId}/items")
    public ResponseEntity<?> listItems(
            @PathVariable UUID studentId, @PathVariable UUID groupId, @PathVariable UUID subtitleId) {
        try {
            return ResponseEntity.ok(reportItemDefinitionService.list(subtitleId, groupId, studentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/subtitles/{subtitleId}/items")
    public ResponseEntity<?> createItem(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable UUID groupId,
            @PathVariable UUID subtitleId,
            @RequestBody @Valid ReportItemDefinitionCreateRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(reportItemDefinitionService.create(
                            subtitleId, groupId, studentId, principal.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{groupId}/subtitles/{subtitleId}/items/reorder")
    public ResponseEntity<?> reorderItems(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable UUID groupId,
            @PathVariable UUID subtitleId,
            @RequestBody @Valid ReportItemReorderRequest request) {
        try {
            reportItemDefinitionService.reorder(subtitleId, groupId, studentId, principal.getId(), request);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{groupId}/subtitles/{subtitleId}/items/{itemId}")
    public ResponseEntity<?> updateItem(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable UUID groupId,
            @PathVariable UUID subtitleId,
            @PathVariable UUID itemId,
            @RequestBody @Valid ReportItemDefinitionUpdateRequest request) {
        try {
            return ResponseEntity.ok(reportItemDefinitionService.update(
                    itemId, subtitleId, groupId, studentId, principal.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{groupId}/subtitles/{subtitleId}/items/{itemId}")
    public ResponseEntity<?> deleteItem(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID studentId,
            @PathVariable UUID groupId,
            @PathVariable UUID subtitleId,
            @PathVariable UUID itemId) {
        try {
            reportItemDefinitionService.delete(itemId, subtitleId, groupId, studentId, principal.getId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
