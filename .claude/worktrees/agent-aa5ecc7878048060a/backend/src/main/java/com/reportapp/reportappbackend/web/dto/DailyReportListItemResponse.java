package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record DailyReportListItemResponse(UUID id, LocalDate reportDate, LocalDateTime submittedAt) {
}
