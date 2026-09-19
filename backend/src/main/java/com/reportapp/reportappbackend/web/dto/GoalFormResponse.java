package com.reportapp.reportappbackend.web.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record GoalFormResponse(
        UUID goalId,
        UUID studentId,
        UUID groupId,
        String title,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        List<Subtitle> subtitles) {

    public record Subtitle(UUID id, String label, List<Item> items) {}

    public record Item(UUID id, String label) {}
}
