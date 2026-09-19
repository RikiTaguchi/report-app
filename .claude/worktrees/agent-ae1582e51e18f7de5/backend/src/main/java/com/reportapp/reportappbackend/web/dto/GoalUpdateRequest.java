package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record GoalUpdateRequest(
        @NotBlank String title,
        String description,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate) {
}
