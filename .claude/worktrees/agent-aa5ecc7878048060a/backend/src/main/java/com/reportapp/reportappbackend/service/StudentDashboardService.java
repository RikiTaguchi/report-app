package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.mapper.DailyReportMapper;
import com.reportapp.reportappbackend.mapper.StudyTimeRecordMapper;
import com.reportapp.reportappbackend.web.dto.StudentDashboardResponse;
import com.reportapp.reportappbackend.web.dto.StudyTimeRecordDTO;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class StudentDashboardService {

    private final GoalService goalService;
    private final DailyReportMapper dailyReportMapper;
    private final StudyTimeRecordMapper studyTimeRecordMapper;

    public StudentDashboardService(
            GoalService goalService, DailyReportMapper dailyReportMapper, StudyTimeRecordMapper studyTimeRecordMapper) {
        this.goalService = goalService;
        this.dailyReportMapper = dailyReportMapper;
        this.studyTimeRecordMapper = studyTimeRecordMapper;
    }

    public StudentDashboardResponse getDashboard(UUID studentId) {
        List<LocalDate> reportDatesDesc = dailyReportMapper.findSubmissionDatesByStudentId(studentId);
        boolean submittedToday = !reportDatesDesc.isEmpty()
                && reportDatesDesc.get(0).equals(LocalDate.now(ZoneId.of("Asia/Tokyo")));

        List<StudyTimeRecordDTO> studyTimeSummary = studyTimeRecordMapper.sumByStudentIdGroupedBySubject(studentId);
        int totalStudyMinutes = studyTimeSummary.stream().mapToInt(StudyTimeRecordDTO::minutes).sum();

        return new StudentDashboardResponse(
                goalService.list(studentId),
                computeStreak(reportDatesDesc),
                submittedToday,
                studyTimeSummary,
                totalStudyMinutes);
    }

    private static int computeStreak(List<LocalDate> reportDatesDesc) {
        if (reportDatesDesc.isEmpty()) {
            return 0;
        }
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Tokyo"));
        LocalDate anchor = reportDatesDesc.get(0);
        if (!anchor.equals(today) && !anchor.equals(today.minusDays(1))) {
            return 0;
        }

        int streak = 0;
        LocalDate expected = anchor;
        for (LocalDate reportDate : reportDatesDesc) {
            if (!reportDate.equals(expected)) {
                break;
            }
            streak++;
            expected = expected.minusDays(1);
        }
        return streak;
    }
}
