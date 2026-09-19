package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ReportItemGroupCreateRequest(@NotNull UUID goalId) {
}
