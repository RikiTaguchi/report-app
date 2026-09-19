package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TeacherResponse(
        UUID id,
        String username,
        String name,
        String lastName,
        String firstName,
        String profileImageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
