package com.reportapp.reportappbackend.web.dto;

import java.util.UUID;

public record ReportItemResponseDTO(UUID reportItemDefinitionId, String label, Boolean checked) {
}
