package com.reportapp.reportappbackend.web.dto;

import java.util.List;

public record StudentReportItemDefinitionsResponse(
        boolean goalPeriodExists,
        List<StudentReportItemResponse> items) {
}
