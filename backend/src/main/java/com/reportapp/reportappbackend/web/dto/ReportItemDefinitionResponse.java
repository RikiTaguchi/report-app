package com.reportapp.reportappbackend.web.dto;

import java.util.UUID;

public record ReportItemDefinitionResponse(UUID id, UUID subtitleId, String label, Integer displayOrder) {
}
