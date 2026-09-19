package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.NotBlank;

public record BlogUpdateRequest(@NotBlank String title, @NotBlank String content) {
}
