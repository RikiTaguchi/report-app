package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReportCommentResponse(
        UUID id,
        String authorType,
        UUID authorId,
        String authorName,
        String authorProfileImageUrl,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
