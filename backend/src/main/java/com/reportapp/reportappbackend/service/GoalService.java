package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.entity.Goal;
import com.reportapp.reportappbackend.entity.GoalProgress;
import com.reportapp.reportappbackend.entity.ReportItemGroup;
import com.reportapp.reportappbackend.entity.Student;
import com.reportapp.reportappbackend.entity.Teacher;
import com.reportapp.reportappbackend.mapper.GoalMapper;
import com.reportapp.reportappbackend.mapper.DailyReportMapper;
import com.reportapp.reportappbackend.mapper.GoalProgressMapper;
import com.reportapp.reportappbackend.mapper.ReportItemDefinitionMapper;
import com.reportapp.reportappbackend.mapper.ReportItemGroupMapper;
import com.reportapp.reportappbackend.mapper.ReportItemSubtitleMapper;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import com.reportapp.reportappbackend.mapper.TeacherMapper;
import com.reportapp.reportappbackend.web.dto.GoalCreateRequest;
import com.reportapp.reportappbackend.web.dto.GoalProgressResponse;
import com.reportapp.reportappbackend.web.dto.GoalResponse;
import com.reportapp.reportappbackend.web.dto.GoalUpdateRequest;
import com.reportapp.reportappbackend.entity.ReportItemSubtitle;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoalService {

    private final GoalMapper goalMapper;
    private final DailyReportMapper dailyReportMapper;
    private final GoalProgressMapper goalProgressMapper;
    private final StudentMapper studentMapper;
    private final TeacherMapper teacherMapper;
    private final ReportItemGroupMapper reportItemGroupMapper;
    private final ReportItemSubtitleMapper reportItemSubtitleMapper;
    private final ReportItemDefinitionMapper reportItemDefinitionMapper;

    public GoalService(
            GoalMapper goalMapper,
            DailyReportMapper dailyReportMapper,
            GoalProgressMapper goalProgressMapper,
            StudentMapper studentMapper,
            TeacherMapper teacherMapper,
            ReportItemGroupMapper reportItemGroupMapper,
            ReportItemSubtitleMapper reportItemSubtitleMapper,
            ReportItemDefinitionMapper reportItemDefinitionMapper) {
        this.goalMapper = goalMapper;
        this.dailyReportMapper = dailyReportMapper;
        this.goalProgressMapper = goalProgressMapper;
        this.studentMapper = studentMapper;
        this.teacherMapper = teacherMapper;
        this.reportItemGroupMapper = reportItemGroupMapper;
        this.reportItemSubtitleMapper = reportItemSubtitleMapper;
        this.reportItemDefinitionMapper = reportItemDefinitionMapper;
    }

    public List<GoalResponse> list(UUID studentId) {
        return goalMapper.findByStudentId(studentId).stream().map(this::toResponse).toList();
    }

    public GoalResponse get(UUID goalId, UUID studentId) {
        Goal goal = findOwnedGoal(goalId, studentId);
        return toResponse(goal);
    }

    @Transactional
    public GoalResponse create(UUID studentId, UUID actingTeacherId, GoalCreateRequest request) {
        Student student =
                studentMapper.findById(studentId).orElseThrow(() -> new IllegalArgumentException("生徒が見つかりません"));
        if (actingTeacherId != null && !actingTeacherId.equals(student.getTeacherId())) {
            throw new IllegalArgumentException("権限がありません");
        }

        Goal goal = new Goal();
        goal.setId(UUID.randomUUID());
        goal.setStudentId(studentId);
        goal.setTeacherId(actingTeacherId != null ? actingTeacherId : student.getTeacherId());
        validatePeriod(request.startDate(), request.endDate());
        validateNoOverlap(studentId, request.startDate(), request.endDate(), null);
        goal.setTitle(request.title());
        goal.setDescription(request.description());
        goal.setStartDate(request.startDate());
        goal.setEndDate(request.endDate());
        goalMapper.insert(goal);
        return toResponse(goalMapper.findById(goal.getId()).orElseThrow());
    }

    @Transactional
    public GoalResponse update(UUID goalId, UUID studentId, UUID actingTeacherId, GoalUpdateRequest request) {
        Goal goal = findOwnedGoal(goalId, studentId);
        checkOwnership(studentId, actingTeacherId);

        validatePeriod(request.startDate(), request.endDate());
        LocalDate earliestSubmitted = dailyReportMapper.findEarliestSubmittedDate(
                studentId, goal.getStartDate(), goal.getEndDate());
        LocalDate latestSubmitted = dailyReportMapper.findLatestSubmittedDate(
                studentId, goal.getStartDate(), goal.getEndDate());
        if (earliestSubmitted != null && request.startDate().isAfter(earliestSubmitted)) {
            throw new IllegalArgumentException("提出済みの日報の日付より後に開始日を変更できません");
        }
        if (latestSubmitted != null && request.endDate().isBefore(latestSubmitted)) {
            throw new IllegalArgumentException("提出済みの日報の日付より前に終了日を変更できません");
        }
        validateNoOverlap(studentId, request.startDate(), request.endDate(), goalId);
        goal.setTitle(request.title());
        goal.setDescription(request.description());
        goal.setStartDate(request.startDate());
        goal.setEndDate(request.endDate());
        goalMapper.update(goal);
        return toResponse(goalMapper.findById(goalId).orElseThrow());
    }

    private static void validatePeriod(LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("終了日は開始日以降にしてください");
        }
    }

    private void validateNoOverlap(UUID studentId, LocalDate startDate, LocalDate endDate, UUID excludeGoalId) {
        if (goalMapper.existsOverlapping(studentId, startDate, endDate, excludeGoalId)) {
            throw new IllegalArgumentException("この期間には既に登録済みの目標があります");
        }
    }

    @Transactional
    public void delete(UUID goalId, UUID studentId, UUID actingTeacherId) {
        Goal goal = findOwnedGoal(goalId, studentId);
        checkOwnership(studentId, actingTeacherId);

        if (dailyReportMapper.existsSubmittedInPeriod(
                studentId, goal.getStartDate(), goal.getEndDate())) {
            throw new IllegalArgumentException("提出済みの日報が存在するため削除できません");
        }

        reportItemGroupMapper.findByGoalId(goalId).ifPresent(group -> {
            for (var subtitle : reportItemSubtitleMapper.findByGroupId(group.getId())) {
                for (var definition : reportItemDefinitionMapper.findBySubtitleId(subtitle.getId())) {
                    if (reportItemDefinitionMapper.countResponsesByDefinitionId(definition.getId()) > 0) {
                        throw new IllegalArgumentException("回答が存在するため削除できません");
                    }
                }
            }
        });

        goalProgressMapper.deleteByGoalId(goalId);
        goalMapper.deleteById(goalId);
    }

    private void checkOwnership(UUID studentId, UUID actingTeacherId) {
        if (actingTeacherId == null) {
            return;
        }
        Student student =
                studentMapper.findById(studentId).orElseThrow(() -> new IllegalArgumentException("生徒が見つかりません"));
        if (!actingTeacherId.equals(student.getTeacherId())) {
            throw new IllegalArgumentException("権限がありません");
        }
    }

    private Goal findOwnedGoal(UUID goalId, UUID studentId) {
        Goal goal = goalMapper.findById(goalId).orElseThrow(() -> new IllegalArgumentException("目標が見つかりません"));
        if (!goal.getStudentId().equals(studentId)) {
            throw new IllegalArgumentException("目標が見つかりません");
        }
        return goal;
    }

    private GoalResponse toResponse(Goal goal) {
        GoalProgress latest = goalProgressMapper.findLatestByGoalId(goal.getId()).orElse(null);
        GoalProgressResponse latestProgress = latest == null ? null : toProgressResponse(latest);
        String teacherName = teacherMapper.findById(goal.getTeacherId()).map(Teacher::getName).orElse(null);
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Tokyo"));
        boolean isCurrent = !today.isBefore(goal.getStartDate()) && !today.isAfter(goal.getEndDate());

        ReportItemGroup group = reportItemGroupMapper.findByGoalId(goal.getId()).orElse(null);
        List<String> reportItemSubtitleLabels = group == null
                ? Collections.emptyList()
                : reportItemSubtitleMapper.findByGroupId(group.getId()).stream()
                        .map(ReportItemSubtitle::getLabel)
                        .toList();

        return new GoalResponse(
                goal.getId(),
                goal.getStudentId(),
                goal.getTeacherId(),
                teacherName,
                goal.getTitle(),
                goal.getDescription(),
                goal.getStartDate(),
                goal.getEndDate(),
                isCurrent,
                latestProgress,
                goal.getCreatedAt(),
                goal.getUpdatedAt(),
                reportItemSubtitleLabels);
    }

    private static GoalProgressResponse toProgressResponse(GoalProgress progress) {
        return new GoalProgressResponse(
                progress.getId(),
                progress.getGoalId(),
                progress.getProgressPercent(),
                progress.getComment(),
                progress.getRecordedDate(),
                progress.getCreatedAt(),
                progress.getUpdatedAt());
    }
}
