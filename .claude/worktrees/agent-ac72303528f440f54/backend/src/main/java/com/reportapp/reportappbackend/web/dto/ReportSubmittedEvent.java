package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ReportSubmittedEvent(
        UUID studentId, String studentName, UUID teacherId, LocalDate reportDate, LocalDateTime submittedAt) {
}
