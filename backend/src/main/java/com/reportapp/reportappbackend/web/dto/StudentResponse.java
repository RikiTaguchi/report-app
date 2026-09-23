package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record StudentResponse(
        UUID id,
        String username,
        String name,
        String lastName,
        String firstName,
        UUID teacherId,
        String teacherName,
        String profileImageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
