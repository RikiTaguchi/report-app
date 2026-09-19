package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.entity.Goal;
import com.reportapp.reportappbackend.entity.ReportItemGroup;
import com.reportapp.reportappbackend.entity.ReportItemSubtitle;
import com.reportapp.reportappbackend.entity.Student;
import com.reportapp.reportappbackend.mapper.GoalMapper;
import com.reportapp.reportappbackend.mapper.ReportItemDefinitionMapper;
import com.reportapp.reportappbackend.mapper.ReportItemGroupMapper;
import com.reportapp.reportappbackend.mapper.ReportItemSubtitleMapper;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import com.reportapp.reportappbackend.web.dto.ReportItemGroupCreateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemGroupResponse;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportItemGroupService {

    private final ReportItemGroupMapper reportItemGroupMapper;
    private final ReportItemSubtitleMapper reportItemSubtitleMapper;
    private final ReportItemDefinitionMapper reportItemDefinitionMapper;
    private final GoalMapper goalMapper;
    private final StudentMapper studentMapper;

    public ReportItemGroupService(
            ReportItemGroupMapper reportItemGroupMapper,
            ReportItemSubtitleMapper reportItemSubtitleMapper,
            ReportItemDefinitionMapper reportItemDefinitionMapper,
            GoalMapper goalMapper,
            StudentMapper studentMapper) {
        this.reportItemGroupMapper = reportItemGroupMapper;
        this.reportItemSubtitleMapper = reportItemSubtitleMapper;
        this.reportItemDefinitionMapper = reportItemDefinitionMapper;
        this.goalMapper = goalMapper;
        this.studentMapper = studentMapper;
    }

    public List<ReportItemGroupResponse> list(UUID studentId) {
        return reportItemGroupMapper.findByStudentId(studentId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReportItemGroupResponse create(UUID studentId, UUID actingTeacherId, ReportItemGroupCreateRequest request) {
        checkOwnership(studentId, actingTeacherId);

        Goal goal = goalMapper.findById(request.goalId()).orElseThrow(() -> new IllegalArgumentException("目標が見つかりません"));
        if (!goal.getStudentId().equals(studentId)) {
            throw new IllegalArgumentException("目標が見つかりません");
        }
        if (reportItemGroupMapper.findByGoalId(goal.getId()).isPresent()) {
            throw new IllegalArgumentException("この目標には既に日報項目グループが作成されています");
        }

        for (ReportItemGroup existingGroup : reportItemGroupMapper.findByStudentId(studentId)) {
            Goal existingGoal = goalMapper.findById(existingGroup.getGoalId()).orElseThrow();
            if (periodsOverlap(goal.getStartDate(), goal.getEndDate(), existingGoal.getStartDate(), existingGoal.getEndDate())) {
                throw new IllegalArgumentException("既存の期間と重複しています");
            }
        }

        ReportItemGroup group = new ReportItemGroup();
        group.setId(UUID.randomUUID());
        group.setStudentId(studentId);
        group.setGoalId(goal.getId());
        reportItemGroupMapper.insert(group);
        return toResponse(reportItemGroupMapper.findById(group.getId()).orElseThrow());
    }

    @Transactional
    public void delete(UUID groupId, UUID studentId, UUID actingTeacherId) {
        checkOwnership(studentId, actingTeacherId);
        ReportItemGroup group = findOwnedGroup(groupId, studentId);

        for (ReportItemSubtitle subtitle : reportItemSubtitleMapper.findByGroupId(group.getId())) {
            for (var definition : reportItemDefinitionMapper.findBySubtitleId(subtitle.getId())) {
                if (reportItemDefinitionMapper.countResponsesByDefinitionId(definition.getId()) > 0) {
                    throw new IllegalArgumentException("回答が存在するため削除できません");
                }
            }
        }

        reportItemGroupMapper.deleteById(groupId);
    }

    private static boolean periodsOverlap(LocalDate startA, LocalDate endA, LocalDate startB, LocalDate endB) {
        return !endA.isBefore(startB) && !startA.isAfter(endB);
    }

    private ReportItemGroup findOwnedGroup(UUID groupId, UUID studentId) {
        ReportItemGroup group =
                reportItemGroupMapper.findById(groupId).orElseThrow(() -> new IllegalArgumentException("グループが見つかりません"));
        if (!group.getStudentId().equals(studentId)) {
            throw new IllegalArgumentException("グループが見つかりません");
        }
        return group;
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

    private ReportItemGroupResponse toResponse(ReportItemGroup group) {
        Goal goal = goalMapper.findById(group.getGoalId()).orElseThrow();
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Tokyo"));
        boolean isCurrent = !today.isBefore(goal.getStartDate()) && !today.isAfter(goal.getEndDate());
        return new ReportItemGroupResponse(
                group.getId(),
                group.getStudentId(),
                group.getGoalId(),
                goal.getTitle(),
                goal.getStartDate(),
                goal.getEndDate(),
                isCurrent,
                group.getCreatedAt(),
                group.getUpdatedAt());
    }
}
