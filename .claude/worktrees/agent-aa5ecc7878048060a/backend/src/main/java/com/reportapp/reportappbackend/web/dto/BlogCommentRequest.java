package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record BlogCommentRequest(@NotBlank String content, UUID parentCommentId) {
}
