package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReportItemSubtitleResponse(
        UUID id,
        UUID groupId,
        String label,
        Integer displayOrder,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
