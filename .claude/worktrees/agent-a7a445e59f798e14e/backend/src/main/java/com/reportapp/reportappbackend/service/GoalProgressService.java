package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.entity.Goal;
import com.reportapp.reportappbackend.entity.GoalProgress;
import com.reportapp.reportappbackend.entity.Student;
import com.reportapp.reportappbackend.mapper.GoalMapper;
import com.reportapp.reportappbackend.mapper.GoalProgressMapper;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import com.reportapp.reportappbackend.web.dto.GoalProgressCreateRequest;
import com.reportapp.reportappbackend.web.dto.GoalProgressResponse;
import com.reportapp.reportappbackend.web.dto.GoalProgressUpdateRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoalProgressService {

    private final GoalProgressMapper goalProgressMapper;
    private final GoalMapper goalMapper;
    private final StudentMapper studentMapper;

    public GoalProgressService(
            GoalProgressMapper goalProgressMapper, GoalMapper goalMapper, StudentMapper studentMapper) {
        this.goalProgressMapper = goalProgressMapper;
        this.goalMapper = goalMapper;
        this.studentMapper = studentMapper;
    }

    public List<GoalProgressResponse> list(UUID goalId, UUID studentId) {
        findOwnedGoal(goalId, studentId);
        return goalProgressMapper.findByGoalId(goalId).stream().map(GoalProgressService::toResponse).toList();
    }

    @Transactional
    public GoalProgressResponse create(
            UUID goalId, UUID studentId, UUID actingTeacherId, GoalProgressCreateRequest request) {
        findOwnedGoal(goalId, studentId);
        checkOwnership(studentId, actingTeacherId);

        GoalProgress progress = new GoalProgress();
        progress.setId(UUID.randomUUID());
        progress.setGoalId(goalId);
        progress.setProgressPercent(request.progressPercent());
        progress.setComment(request.comment());
        progress.setRecordedDate(request.recordedDate());
        goalProgressMapper.insert(progress);
        return toResponse(goalProgressMapper.findById(progress.getId()).orElseThrow());
    }

    @Transactional
    public GoalProgressResponse update(
            UUID progressId,
            UUID goalId,
            UUID studentId,
            UUID actingTeacherId,
            GoalProgressUpdateRequest request) {
        findOwnedGoal(goalId, studentId);
        checkOwnership(studentId, actingTeacherId);
        GoalProgress progress = findOwnedProgress(progressId, goalId);

        progress.setProgressPercent(request.progressPercent());
        progress.setComment(request.comment());
        progress.setRecordedDate(request.recordedDate());
        goalProgressMapper.update(progress);
        return toResponse(goalProgressMapper.findById(progressId).orElseThrow());
    }

    @Transactional
    public void delete(UUID progressId, UUID goalId, UUID studentId, UUID actingTeacherId) {
        findOwnedGoal(goalId, studentId);
        checkOwnership(studentId, actingTeacherId);
        findOwnedProgress(progressId, goalId);

        goalProgressMapper.deleteById(progressId);
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

    private GoalProgress findOwnedProgress(UUID progressId, UUID goalId) {
        GoalProgress progress = goalProgressMapper
                .findById(progressId)
                .orElseThrow(() -> new IllegalArgumentException("進捗記録が見つかりません"));
        if (!progress.getGoalId().equals(goalId)) {
            throw new IllegalArgumentException("進捗記録が見つかりません");
        }
        return progress;
    }

    private static GoalProgressResponse toResponse(GoalProgress progress) {
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
