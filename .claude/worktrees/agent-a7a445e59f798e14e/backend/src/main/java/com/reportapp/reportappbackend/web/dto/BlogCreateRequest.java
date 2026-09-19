package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.NotBlank;

public record BlogCreateRequest(@NotBlank String title, @NotBlank String content) {
}
