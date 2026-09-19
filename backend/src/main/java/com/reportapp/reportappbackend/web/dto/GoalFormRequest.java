package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record GoalFormRequest(
        @NotBlank String title,
        String description,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull @Valid List<Subtitle> subtitles) {

    public record Subtitle(
            UUID id,
            @NotBlank String label,
            @NotNull @Valid List<Item> items) {}

    public record Item(UUID id, @NotBlank String label) {}
}
