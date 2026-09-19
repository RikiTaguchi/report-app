package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record ReportItemReorderRequest(@NotNull String itemType, @NotEmpty List<UUID> orderedIds) {
}
