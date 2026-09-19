package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record BlogImageResponse(UUID id, String imageUrl, LocalDateTime createdAt) {
}
