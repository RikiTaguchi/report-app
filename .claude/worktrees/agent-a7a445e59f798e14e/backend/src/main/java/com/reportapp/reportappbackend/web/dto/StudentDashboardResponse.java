package com.reportapp.reportappbackend.web.dto;

import java.util.List;

public record StudentDashboardResponse(
        List<GoalResponse> goals,
        int consecutiveSubmissionDays,
        boolean submittedToday,
        List<StudyTimeRecordDTO> studyTimeSummary,
        int totalStudyMinutes) {
}
