package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record BlogResponse(
        UUID id,
        UUID teacherId,
        String teacherName,
        String title,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        int likeCount,
        int commentCount,
        boolean likedByMe) {
}
