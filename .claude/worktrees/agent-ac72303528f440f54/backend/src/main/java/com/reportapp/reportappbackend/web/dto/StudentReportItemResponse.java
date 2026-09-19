package com.reportapp.reportappbackend.web.dto;

import java.util.UUID;

public record StudentReportItemResponse(
        UUID id,
        UUID subtitleId,
        String subtitleLabel,
        String itemType,
        String label,
        Integer displayOrder,
        UUID goalId,
        String goalTitle) {
}
