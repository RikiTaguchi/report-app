package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ReportItemSubtitleUpdateRequest(@NotBlank String label) {
}
