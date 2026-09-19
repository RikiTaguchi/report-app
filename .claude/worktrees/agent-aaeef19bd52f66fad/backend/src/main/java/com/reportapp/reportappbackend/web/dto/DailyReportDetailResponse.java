package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record DailyReportDetailResponse(
        UUID id,
        LocalDate reportDate,
        List<ReportItemResponseDTO> items,
        List<StudyTimeRecordDTO> studyTimes,
        String freeText,
        LocalDateTime submittedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
