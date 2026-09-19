package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record GoalProgressCreateRequest(
        @NotNull @Min(0) @Max(100) Integer progressPercent, String comment, @NotNull LocalDate recordedDate) {
}
