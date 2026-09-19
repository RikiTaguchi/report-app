package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.entity.Goal;
import com.reportapp.reportappbackend.entity.ReportItemDefinition;
import com.reportapp.reportappbackend.entity.ReportItemGroup;
import com.reportapp.reportappbackend.entity.ReportItemSubtitle;
import com.reportapp.reportappbackend.entity.Student;
import com.reportapp.reportappbackend.mapper.GoalMapper;
import com.reportapp.reportappbackend.mapper.ReportItemDefinitionMapper;
import com.reportapp.reportappbackend.mapper.ReportItemGroupMapper;
import com.reportapp.reportappbackend.mapper.ReportItemSubtitleMapper;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import com.reportapp.reportappbackend.web.dto.ReportItemDefinitionCreateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemDefinitionResponse;
import com.reportapp.reportappbackend.web.dto.ReportItemDefinitionUpdateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemReorderRequest;
import com.reportapp.reportappbackend.web.dto.StudentReportItemResponse;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportItemDefinitionService {

    private final ReportItemDefinitionMapper reportItemDefinitionMapper;
    private final ReportItemSubtitleMapper reportItemSubtitleMapper;
    private final ReportItemGroupMapper reportItemGroupMapper;
    private final GoalMapper goalMapper;
    private final StudentMapper studentMapper;

    public ReportItemDefinitionService(
            ReportItemDefinitionMapper reportItemDefinitionMapper,
            ReportItemSubtitleMapper reportItemSubtitleMapper,
            ReportItemGroupMapper reportItemGroupMapper,
            GoalMapper goalMapper,
            StudentMapper studentMapper) {
        this.reportItemDefinitionMapper = reportItemDefinitionMapper;
        this.reportItemSubtitleMapper = reportItemSubtitleMapper;
        this.reportItemGroupMapper = reportItemGroupMapper;
        this.goalMapper = goalMapper;
        this.studentMapper = studentMapper;
    }

    public List<ReportItemDefinitionResponse> list(UUID subtitleId, UUID groupId, UUID studentId) {
        findOwnedSubtitle(subtitleId, groupId, studentId);
        return reportItemDefinitionMapper.findBySubtitleId(subtitleId).stream()
                .map(ReportItemDefinitionService::toResponse)
                .toList();
    }

    public List<StudentReportItemResponse> listApplicable(UUID studentId, LocalDate reportDate) {
        List<ReportItemDefinition> definitions =
                reportItemDefinitionMapper.findApplicableByStudentIdAndDate(studentId, reportDate);
        if (definitions.isEmpty()) {
            return List.of();
        }

        List<ReportItemSubtitle> subtitles = reportItemSubtitleMapper.findByStudentId(studentId);
        Map<UUID, String> subtitleLabels = subtitles.stream()
                .collect(java.util.stream.Collectors.toMap(ReportItemSubtitle::getId, ReportItemSubtitle::getLabel));
        Map<UUID, UUID> subtitleToGroupId = subtitles.stream()
                .collect(java.util.stream.Collectors.toMap(ReportItemSubtitle::getId, ReportItemSubtitle::getGroupId));

        UUID resolvedGoalId = null;
        String resolvedGoalTitle = null;
        UUID firstGroupId = subtitleToGroupId.get(definitions.get(0).getSubtitleId());
        if (firstGroupId != null) {
            ReportItemGroup group = reportItemGroupMapper.findById(firstGroupId).orElse(null);
            if (group != null) {
                Goal goal = goalMapper.findById(group.getGoalId()).orElse(null);
                if (goal != null) {
                    resolvedGoalId = goal.getId();
                    resolvedGoalTitle = goal.getTitle();
                }
            }
        }

        UUID goalId = resolvedGoalId;
        String goalTitle = resolvedGoalTitle;
        return definitions.stream()
                .map(definition -> new StudentReportItemResponse(
                        definition.getId(),
                        definition.getSubtitleId(),
                        subtitleLabels.get(definition.getSubtitleId()),
                        definition.getLabel(),
                        definition.getDisplayOrder(),
                        goalId,
                        goalTitle))
                .toList();
    }

    @Transactional
    public ReportItemDefinitionResponse create(
            UUID subtitleId, UUID groupId, UUID studentId, UUID actingTeacherId, ReportItemDefinitionCreateRequest request) {
        checkOwnership(studentId, actingTeacherId);
        findOwnedSubtitle(subtitleId, groupId, studentId);
        if (reportItemDefinitionMapper.findBySubtitleId(subtitleId).size() >= 5) {
            throw new IllegalArgumentException("1つのサブタイトルにつき項目は5個まで登録できます");
        }

        ReportItemDefinition definition = new ReportItemDefinition();
        definition.setId(UUID.randomUUID());
        definition.setSubtitleId(subtitleId);
        definition.setLabel(request.label());
        definition.setDisplayOrder(reportItemDefinitionMapper.findMaxDisplayOrder(subtitleId) + 1);
        reportItemDefinitionMapper.insert(definition);
        return toResponse(reportItemDefinitionMapper.findById(definition.getId()).orElseThrow());
    }

    @Transactional
    public ReportItemDefinitionResponse update(
            UUID definitionId,
            UUID subtitleId,
            UUID groupId,
            UUID studentId,
            UUID actingTeacherId,
            ReportItemDefinitionUpdateRequest request) {
        checkOwnership(studentId, actingTeacherId);
        findOwnedSubtitle(subtitleId, groupId, studentId);
        ReportItemDefinition definition = findOwnedDefinition(definitionId, subtitleId);

        definition.setLabel(request.label());
        reportItemDefinitionMapper.update(definition);
        return toResponse(reportItemDefinitionMapper.findById(definitionId).orElseThrow());
    }

    @Transactional
    public void delete(UUID definitionId, UUID subtitleId, UUID groupId, UUID studentId, UUID actingTeacherId) {
        checkOwnership(studentId, actingTeacherId);
        findOwnedSubtitle(subtitleId, groupId, studentId);
        findOwnedDefinition(definitionId, subtitleId);

        if (reportItemDefinitionMapper.countResponsesByDefinitionId(definitionId) > 0) {
            throw new IllegalArgumentException("回答が存在するため削除できません");
        }
        reportItemDefinitionMapper.deleteById(definitionId);
    }

    @Transactional
    public void reorder(
            UUID subtitleId, UUID groupId, UUID studentId, UUID actingTeacherId, ReportItemReorderRequest request) {
        checkOwnership(studentId, actingTeacherId);
        findOwnedSubtitle(subtitleId, groupId, studentId);
        List<ReportItemDefinition> existingDefinitions = reportItemDefinitionMapper.findBySubtitleId(subtitleId);
        Set<UUID> existingIds = existingDefinitions.stream()
                .map(ReportItemDefinition::getId)
                .collect(java.util.stream.Collectors.toSet());
        Set<UUID> requestedIds = new HashSet<>(request.orderedIds());
        if (requestedIds.size() != request.orderedIds().size()
                || requestedIds.size() != existingIds.size()
                || !requestedIds.equals(existingIds)) {
            throw new IllegalArgumentException("並び替え対象の項目が一致しません");
        }
        int order = 0;
        for (UUID definitionId : request.orderedIds()) {
            reportItemDefinitionMapper.updateDisplayOrder(definitionId, order);
            order++;
        }
    }

    private ReportItemSubtitle findOwnedSubtitle(UUID subtitleId, UUID groupId, UUID studentId) {
        ReportItemGroup group =
                reportItemGroupMapper.findById(groupId).orElseThrow(() -> new IllegalArgumentException("グループが見つかりません"));
        if (!group.getStudentId().equals(studentId)) {
            throw new IllegalArgumentException("グループが見つかりません");
        }
        ReportItemSubtitle subtitle = reportItemSubtitleMapper
                .findById(subtitleId)
                .orElseThrow(() -> new IllegalArgumentException("サブタイトルが見つかりません"));
        if (!subtitle.getGroupId().equals(groupId)) {
            throw new IllegalArgumentException("サブタイトルが見つかりません");
        }
        return subtitle;
    }

    private ReportItemDefinition findOwnedDefinition(UUID definitionId, UUID subtitleId) {
        ReportItemDefinition definition = reportItemDefinitionMapper
                .findById(definitionId)
                .orElseThrow(() -> new IllegalArgumentException("項目が見つかりません"));
        if (!definition.getSubtitleId().equals(subtitleId)) {
            throw new IllegalArgumentException("項目が見つかりません");
        }
        return definition;
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

    private static ReportItemDefinitionResponse toResponse(ReportItemDefinition definition) {
        return new ReportItemDefinitionResponse(
                definition.getId(),
                definition.getSubtitleId(),
                definition.getLabel(),
                definition.getDisplayOrder());
    }
}
