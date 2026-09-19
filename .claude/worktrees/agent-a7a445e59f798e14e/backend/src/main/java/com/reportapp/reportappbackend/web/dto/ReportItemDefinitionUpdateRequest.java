package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReportItemDefinitionUpdateRequest(@NotBlank String label, @NotNull String itemType) {
}
