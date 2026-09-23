package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record BlogCommentResponse(
        UUID id,
        UUID blogId,
        String authorType,
        UUID authorId,
        String authorName,
        String authorProfileImageUrl,
        String content,
        UUID parentCommentId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
