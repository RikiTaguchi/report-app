package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ReportItemGroupResponse(
        UUID id,
        UUID studentId,
        UUID goalId,
        String goalTitle,
        LocalDate startDate,
        LocalDate endDate,
        boolean isCurrent,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
