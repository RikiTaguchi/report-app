package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.entity.DailyReport;
import com.reportapp.reportappbackend.entity.ReportImage;
import com.reportapp.reportappbackend.entity.ReportItemDefinition;
import com.reportapp.reportappbackend.entity.ReportItemResponse;
import com.reportapp.reportappbackend.entity.Student;
import com.reportapp.reportappbackend.entity.StudyTimeRecord;
import com.reportapp.reportappbackend.entity.Subject;
import com.reportapp.reportappbackend.mapper.DailyReportMapper;
import com.reportapp.reportappbackend.mapper.GoalMapper;
import com.reportapp.reportappbackend.mapper.ReportImageMapper;
import com.reportapp.reportappbackend.mapper.ReportItemDefinitionMapper;
import com.reportapp.reportappbackend.mapper.ReportItemResponseMapper;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import com.reportapp.reportappbackend.mapper.StudyTimeRecordMapper;
import com.reportapp.reportappbackend.mapper.SubjectMapper;
import com.reportapp.reportappbackend.web.dto.DailyReportDetailResponse;
import com.reportapp.reportappbackend.web.dto.DailyReportListItemResponse;
import com.reportapp.reportappbackend.web.dto.DailyReportSubmitRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemResponseDTO;
import com.reportapp.reportappbackend.web.dto.ReportSubmittedEvent;
import com.reportapp.reportappbackend.web.dto.StudyTimeRecordDTO;
import com.reportapp.reportappbackend.websocket.RealtimeTopics;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DailyReportService {

    private final DailyReportMapper dailyReportMapper;
    private final GoalMapper goalMapper;
    private final ReportItemResponseMapper reportItemResponseMapper;
    private final StudyTimeRecordMapper studyTimeRecordMapper;
    private final ReportItemDefinitionMapper reportItemDefinitionMapper;
    private final ReportImageMapper reportImageMapper;
    private final SubjectMapper subjectMapper;
    private final StudentMapper studentMapper;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;

    public DailyReportService(
            DailyReportMapper dailyReportMapper,
            GoalMapper goalMapper,
            ReportItemResponseMapper reportItemResponseMapper,
            StudyTimeRecordMapper studyTimeRecordMapper,
            ReportItemDefinitionMapper reportItemDefinitionMapper,
            ReportImageMapper reportImageMapper,
            SubjectMapper subjectMapper,
            StudentMapper studentMapper,
            FileStorageService fileStorageService,
            SimpMessagingTemplate messagingTemplate) {
        this.dailyReportMapper = dailyReportMapper;
        this.goalMapper = goalMapper;
        this.reportItemResponseMapper = reportItemResponseMapper;
        this.studyTimeRecordMapper = studyTimeRecordMapper;
        this.reportItemDefinitionMapper = reportItemDefinitionMapper;
        this.reportImageMapper = reportImageMapper;
        this.subjectMapper = subjectMapper;
        this.studentMapper = studentMapper;
        this.fileStorageService = fileStorageService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public DailyReportDetailResponse saveReport(
            UUID studentId, LocalDate reportDate, DailyReportSubmitRequest request) {
        return saveReport(studentId, reportDate, request, false);
    }

    @Transactional
    public DailyReportDetailResponse saveReport(
            UUID studentId, LocalDate reportDate, DailyReportSubmitRequest request, boolean createOnly) {
        List<DailyReportSubmitRequest.ItemRequest> items =
                request.items() == null ? List.of() : request.items();
        List<DailyReportSubmitRequest.StudyTimeRequest> studyTimes =
                request.studyTimes() == null ? List.of() : request.studyTimes();

        Set<UUID> validDefinitionIds = reportItemDefinitionMapper
                .findApplicableByStudentIdAndDate(studentId, reportDate)
                .stream()
                .map(ReportItemDefinition::getId)
                .collect(Collectors.toSet());
        Set<UUID> validSubjectIds =
                subjectMapper.findAll().stream().map(Subject::getId).collect(Collectors.toSet());

        Set<UUID> seenDefinitionIds = new HashSet<>();
        for (DailyReportSubmitRequest.ItemRequest item : items) {
            if (!validDefinitionIds.contains(item.reportItemDefinitionId())) {
                throw new IllegalArgumentException("不正なreportItemDefinitionIdが含まれています");
            }
            if (!seenDefinitionIds.add(item.reportItemDefinitionId())) {
                throw new IllegalArgumentException("reportItemDefinitionIdが重複しています");
            }
        }
        Set<UUID> seenSubjectIds = new HashSet<>();
        for (DailyReportSubmitRequest.StudyTimeRequest studyTime : studyTimes) {
            if (!validSubjectIds.contains(studyTime.subjectId())) {
                throw new IllegalArgumentException("不正なsubjectIdが含まれています");
            }
            if (!seenSubjectIds.add(studyTime.subjectId())) {
                throw new IllegalArgumentException("subjectIdが重複しています");
            }
        }

        DailyReport report = dailyReportMapper
                .findByStudentIdAndReportDate(studentId, reportDate)
                .orElse(null);
        // 画像アップロード時に自動作成される未提出のレポート行は、提出処理においては
        // 「まだ存在しない」ものとして扱う（submittedAtの有無のみが提出済みかどうかの基準）。
        boolean isSubmitted = report != null && report.getSubmittedAt() != null;
        if (createOnly && isSubmitted) {
            throw new IllegalArgumentException("この日付のレポートは既に提出済みです");
        }
        boolean isNewSubmission = !isSubmitted;
        if (isNewSubmission) {
            LocalDate today = LocalDate.now(ZoneId.of("Asia/Tokyo"));
            if (reportDate.isAfter(today)) {
                throw new IllegalArgumentException("未来の日付のレポートは提出できません");
            }
            if (!goalMapper.existsCoveringDate(studentId, reportDate)) {
                throw new IllegalArgumentException("この日付を含む期間の目標が設定されていないため、レポートを提出できません");
            }

            LocalDateTime submittedAt = LocalDateTime.now(ZoneId.of("Asia/Tokyo"));
            if (report == null) {
                report = new DailyReport();
                report.setId(UUID.randomUUID());
                report.setStudentId(studentId);
                report.setReportDate(reportDate);
                report.setSubmittedAt(submittedAt);
                dailyReportMapper.insert(report);
            } else {
                dailyReportMapper.markSubmitted(report.getId(), submittedAt);
                report.setSubmittedAt(submittedAt);
            }

            Student student = studentMapper.findById(studentId).orElseThrow();
            messagingTemplate.convertAndSend(
                    RealtimeTopics.REPORT_SUBMISSIONS,
                    new ReportSubmittedEvent(
                            studentId, student.getName(), student.getTeacherId(), reportDate, submittedAt));
        }

        UUID dailyReportId = report.getId();
        dailyReportMapper.updateFreeText(dailyReportId, request.freeText());
        reportItemResponseMapper.deleteByDailyReportId(dailyReportId);
        studyTimeRecordMapper.deleteByDailyReportId(dailyReportId);

        if (!items.isEmpty()) {
            List<ReportItemResponse> responseEntities = items.stream()
                    .map(item -> {
                        ReportItemResponse response = new ReportItemResponse();
                        response.setId(UUID.randomUUID());
                        response.setDailyReportId(dailyReportId);
                        response.setReportItemDefinitionId(item.reportItemDefinitionId());
                        response.setChecked(item.checked());
                        response.setTextValue(item.textValue());
                        return response;
                    })
                    .toList();
            reportItemResponseMapper.insertBatch(responseEntities);
        }

        if (!studyTimes.isEmpty()) {
            List<StudyTimeRecord> recordEntities = studyTimes.stream()
                    .map(studyTime -> {
                        StudyTimeRecord record = new StudyTimeRecord();
                        record.setId(UUID.randomUUID());
                        record.setDailyReportId(dailyReportId);
                        record.setSubjectId(studyTime.subjectId());
                        record.setMinutes(studyTime.minutes());
                        return record;
                    })
                    .toList();
            studyTimeRecordMapper.insertBatch(recordEntities);
        }

        return getReport(studentId, reportDate).orElseThrow();
    }

    public Optional<DailyReportDetailResponse> getReport(UUID studentId, LocalDate reportDate) {
        return dailyReportMapper
                .findByStudentIdAndReportDate(studentId, reportDate)
                .map(report -> toDetailResponse(report, studentId));
    }

    public Optional<DailyReportDetailResponse> getReportForTeacher(UUID studentId, LocalDate reportDate) {
        return dailyReportMapper
                .findByStudentIdAndReportDate(studentId, reportDate)
                .filter(report -> report.getSubmittedAt() != null)
                .map(report -> toDetailResponse(report, studentId));
    }

    public List<DailyReportListItemResponse> listReports(UUID studentId) {
        return dailyReportMapper.findByStudentId(studentId).stream()
                .map(report -> new DailyReportListItemResponse(
                        report.getId(), report.getReportDate(), report.getSubmittedAt()))
                .toList();
    }

    public boolean isReportVisibleTo(UUID dailyReportId, String role, UUID actorId) {
        return dailyReportMapper
                .findById(dailyReportId)
                .map(report -> switch (role) {
                    case "ADMIN" -> true;
                    case "STUDENT" -> report.getStudentId().equals(actorId);
                    case "TEACHER" -> report.getSubmittedAt() != null;
                    default -> false;
                })
                .orElse(false);
    }

    @Transactional
    public void deleteReport(UUID studentId, LocalDate reportDate) {
        DailyReport report = dailyReportMapper
                .findByStudentIdAndReportDate(studentId, reportDate)
                .orElseThrow(() -> new IllegalArgumentException("日報が見つかりません"));
        for (ReportImage image : reportImageMapper.findByDailyReportId(report.getId())) {
            fileStorageService.deleteFile(image.getImageUrl());
        }
        dailyReportMapper.deleteById(report.getId());
    }

    public List<DailyReportListItemResponse> listSubmittedReports(UUID studentId) {
        return dailyReportMapper.findByStudentId(studentId).stream()
                .filter(report -> report.getSubmittedAt() != null)
                .map(report -> new DailyReportListItemResponse(
                        report.getId(), report.getReportDate(), report.getSubmittedAt()))
                .toList();
    }

    private DailyReportDetailResponse toDetailResponse(DailyReport report, UUID studentId) {
        Map<UUID, ReportItemDefinition> definitionsById = reportItemDefinitionMapper.findByStudentId(studentId).stream()
                .collect(Collectors.toMap(ReportItemDefinition::getId, definition -> definition));
        Map<UUID, Subject> subjectsById =
                subjectMapper.findAll().stream().collect(Collectors.toMap(Subject::getId, subject -> subject));

        List<ReportItemResponseDTO> items = reportItemResponseMapper.findByDailyReportId(report.getId()).stream()
                .map(response -> {
                    ReportItemDefinition definition = definitionsById.get(response.getReportItemDefinitionId());
                    return new ReportItemResponseDTO(
                            response.getReportItemDefinitionId(),
                            definition != null ? definition.getLabel() : null,
                            definition != null ? definition.getItemType().name() : null,
                            response.getChecked(),
                            response.getTextValue());
                })
                .toList();

        List<StudyTimeRecordDTO> studyTimes = studyTimeRecordMapper.findByDailyReportId(report.getId()).stream()
                .map(record -> {
                    Subject subject = subjectsById.get(record.getSubjectId());
                    return new StudyTimeRecordDTO(
                            record.getSubjectId(), subject != null ? subject.getName() : null, record.getMinutes());
                })
                .toList();

        return new DailyReportDetailResponse(
                report.getId(),
                report.getReportDate(),
                items,
                studyTimes,
                report.getFreeText(),
                report.getSubmittedAt(),
                report.getCreatedAt(),
                report.getUpdatedAt());
    }
}
