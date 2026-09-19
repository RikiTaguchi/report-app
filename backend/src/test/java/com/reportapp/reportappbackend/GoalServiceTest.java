package com.reportapp.reportappbackend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.reportapp.reportappbackend.entity.Goal;
import com.reportapp.reportappbackend.mapper.DailyReportMapper;
import com.reportapp.reportappbackend.mapper.GoalMapper;
import com.reportapp.reportappbackend.mapper.GoalProgressMapper;
import com.reportapp.reportappbackend.mapper.ReportItemDefinitionMapper;
import com.reportapp.reportappbackend.mapper.ReportItemGroupMapper;
import com.reportapp.reportappbackend.mapper.ReportItemSubtitleMapper;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import com.reportapp.reportappbackend.mapper.TeacherMapper;
import com.reportapp.reportappbackend.service.GoalService;
import com.reportapp.reportappbackend.web.dto.GoalResponse;
import com.reportapp.reportappbackend.web.dto.GoalUpdateRequest;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GoalServiceTest {

    @Mock
    private GoalMapper goalMapper;

    @Mock
    private DailyReportMapper dailyReportMapper;

    @Mock
    private GoalProgressMapper goalProgressMapper;

    @Mock
    private StudentMapper studentMapper;

    @Mock
    private TeacherMapper teacherMapper;

    @Mock
    private ReportItemGroupMapper reportItemGroupMapper;

    @Mock
    private ReportItemSubtitleMapper reportItemSubtitleMapper;

    @Mock
    private ReportItemDefinitionMapper reportItemDefinitionMapper;

    private GoalService service;
    private UUID goalId;
    private UUID studentId;
    private Goal goal;

    @BeforeEach
    void setUp() {
        service = new GoalService(
                goalMapper,
                dailyReportMapper,
                goalProgressMapper,
                studentMapper,
                teacherMapper,
                reportItemGroupMapper,
                reportItemSubtitleMapper,
                reportItemDefinitionMapper);
        goalId = UUID.randomUUID();
        studentId = UUID.randomUUID();
        goal = new Goal();
        goal.setId(goalId);
        goal.setStudentId(studentId);
        goal.setTeacherId(UUID.randomUUID());
        goal.setTitle("目標");
        goal.setStartDate(LocalDate.of(2026, 10, 1));
        goal.setEndDate(LocalDate.of(2026, 10, 10));
        when(goalMapper.findById(goalId)).thenReturn(Optional.of(goal));
    }

    @Test
    void rejectsStartDateAfterEarliestSubmittedReport() {
        when(dailyReportMapper.findEarliestSubmittedDate(
                        studentId, goal.getStartDate(), goal.getEndDate()))
                .thenReturn(LocalDate.of(2026, 10, 3));
        when(dailyReportMapper.findLatestSubmittedDate(
                        studentId, goal.getStartDate(), goal.getEndDate()))
                .thenReturn(LocalDate.of(2026, 10, 8));

        assertThatThrownBy(() -> service.update(
                        goalId,
                        studentId,
                        null,
                        new GoalUpdateRequest(
                                "目標",
                                null,
                                LocalDate.of(2026, 10, 4),
                                LocalDate.of(2026, 10, 10))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("提出済みの日報の日付より後に開始日を変更できません");

        verify(goalMapper, never()).update(any());
    }

    @Test
    void rejectsEndDateBeforeLatestSubmittedReport() {
        when(dailyReportMapper.findEarliestSubmittedDate(
                        studentId, goal.getStartDate(), goal.getEndDate()))
                .thenReturn(LocalDate.of(2026, 10, 3));
        when(dailyReportMapper.findLatestSubmittedDate(
                        studentId, goal.getStartDate(), goal.getEndDate()))
                .thenReturn(LocalDate.of(2026, 10, 8));

        assertThatThrownBy(() -> service.update(
                        goalId,
                        studentId,
                        null,
                        new GoalUpdateRequest(
                                "目標",
                                null,
                                LocalDate.of(2026, 10, 1),
                                LocalDate.of(2026, 10, 7))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("提出済みの日報の日付より前に終了日を変更できません");

        verify(goalMapper, never()).update(any());
    }

    @Test
    void allowsSubmittedDateBoundariesAndIgnoresUnsubmittedRows() {
        when(dailyReportMapper.findEarliestSubmittedDate(
                        studentId, goal.getStartDate(), goal.getEndDate()))
                .thenReturn(null);
        when(dailyReportMapper.findLatestSubmittedDate(
                        studentId, goal.getStartDate(), goal.getEndDate()))
                .thenReturn(null);
        when(goalMapper.existsOverlapping(
                        studentId,
                        LocalDate.of(2026, 10, 1),
                        LocalDate.of(2026, 10, 10),
                        goalId))
                .thenReturn(false);
        when(goalProgressMapper.findLatestByGoalId(goalId)).thenReturn(Optional.empty());
        when(teacherMapper.findById(goal.getTeacherId())).thenReturn(Optional.empty());
        when(reportItemGroupMapper.findByGoalId(goalId)).thenReturn(Optional.empty());

        GoalResponse response = service.update(
                goalId,
                studentId,
                null,
                new GoalUpdateRequest(
                        "更新後の目標",
                        null,
                        LocalDate.of(2026, 10, 1),
                        LocalDate.of(2026, 10, 10)));

        assertThat(response.title()).isEqualTo("更新後の目標");
        verify(goalMapper).update(goal);
    }
}
