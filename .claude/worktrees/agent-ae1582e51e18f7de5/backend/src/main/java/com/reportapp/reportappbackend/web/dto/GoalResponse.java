package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record GoalResponse(
        UUID id,
        UUID studentId,
        UUID teacherId,
        String teacherName,
        String title,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        boolean isCurrent,
        GoalProgressResponse latestProgress,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<String> reportItemSubtitleLabels) {
}
