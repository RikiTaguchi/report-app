package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record GoalProgressResponse(
        UUID id,
        UUID goalId,
        Integer progressPercent,
        String comment,
        LocalDate recordedDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
