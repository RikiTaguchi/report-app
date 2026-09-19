package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record ReportItemReorderRequest(@NotEmpty List<UUID> orderedIds) {
}
