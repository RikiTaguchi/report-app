package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record DailyReportSubmitRequest(
        @Valid List<ItemRequest> items,
        @Valid List<StudyTimeRequest> studyTimes,
        String freeText) {

    public record ItemRequest(@NotNull UUID reportItemDefinitionId, Boolean checked, String textValue) {
    }

    public record StudyTimeRequest(@NotNull UUID subjectId, @NotNull @Min(0) Integer minutes) {
    }
}
