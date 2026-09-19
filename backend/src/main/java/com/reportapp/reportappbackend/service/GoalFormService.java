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
import com.reportapp.reportappbackend.web.dto.GoalCreateRequest;
import com.reportapp.reportappbackend.web.dto.GoalFormRequest;
import com.reportapp.reportappbackend.web.dto.GoalFormResponse;
import com.reportapp.reportappbackend.web.dto.GoalUpdateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemDefinitionCreateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemDefinitionUpdateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemGroupCreateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemSubtitleCreateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemSubtitleUpdateRequest;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoalFormService {

    private final GoalService goalService;
    private final GoalMapper goalMapper;
    private final ReportItemGroupMapper groupMapper;
    private final ReportItemSubtitleMapper subtitleMapper;
    private final ReportItemDefinitionMapper definitionMapper;
    private final StudentMapper studentMapper;
    private final ReportItemGroupService groupService;
    private final ReportItemSubtitleService subtitleService;
    private final ReportItemDefinitionService definitionService;

    public GoalFormService(
            GoalService goalService,
            GoalMapper goalMapper,
            ReportItemGroupMapper groupMapper,
            ReportItemSubtitleMapper subtitleMapper,
            ReportItemDefinitionMapper definitionMapper,
            StudentMapper studentMapper,
            ReportItemGroupService groupService,
            ReportItemSubtitleService subtitleService,
            ReportItemDefinitionService definitionService) {
        this.goalService = goalService;
        this.goalMapper = goalMapper;
        this.groupMapper = groupMapper;
        this.subtitleMapper = subtitleMapper;
        this.definitionMapper = definitionMapper;
        this.studentMapper = studentMapper;
        this.groupService = groupService;
        this.subtitleService = subtitleService;
        this.definitionService = definitionService;
    }

    public GoalFormResponse get(UUID studentId, UUID goalId, UUID teacherId) {
        checkOwnership(studentId, teacherId);
        Goal goal = findGoal(goalId, studentId);
        return toResponse(goal);
    }

    @Transactional
    public GoalFormResponse create(UUID studentId, UUID teacherId, GoalFormRequest request) {
        checkOwnership(studentId, teacherId);
        validateCreateRequest(request);
        validateRequestIds(request, Set.of(), Set.of());
        var created = goalService.create(studentId, teacherId,
                new GoalCreateRequest(request.title(), request.description(), request.startDate(), request.endDate()));
        groupService.create(studentId, teacherId, new ReportItemGroupCreateRequest(created.id()));
        ReportItemGroup group = groupMapper.findByGoalId(created.id()).orElseThrow();
        if (!request.subtitles().isEmpty()) {
            applySubtitles(studentId, teacherId, group, request.subtitles());
        }
        return toResponse(goalMapper.findById(created.id()).orElseThrow());
    }

    @Transactional
    public GoalFormResponse update(UUID studentId, UUID goalId, UUID teacherId, GoalFormRequest request) {
        checkOwnership(studentId, teacherId);
        Goal goal = findGoal(goalId, studentId);
        ReportItemGroup group = groupMapper.findByGoalId(goalId).orElse(null);
        Set<UUID> subtitleIds = new HashSet<>();
        Set<UUID> definitionIds = new HashSet<>();
        if (group != null) {
            for (ReportItemSubtitle subtitle : subtitleMapper.findByGroupId(group.getId())) {
                subtitleIds.add(subtitle.getId());
                for (ReportItemDefinition definition : definitionMapper.findBySubtitleId(subtitle.getId())) {
                    definitionIds.add(definition.getId());
                }
            }
        }
        validateRequestIds(request, subtitleIds, definitionIds);
        validateUpdateStructure(request, group, subtitleIds, definitionIds);
        goalService.update(goalId, studentId, teacherId,
                new GoalUpdateRequest(request.title(), request.description(), request.startDate(), request.endDate()));

        if (group == null) {
            groupService.create(studentId, teacherId, new ReportItemGroupCreateRequest(goalId));
            group = groupMapper.findByGoalId(goalId).orElseThrow();
        }
        if (!request.subtitles().isEmpty()) {
            applySubtitles(studentId, teacherId, group, request.subtitles());
        }
        return toResponse(goalMapper.findById(goalId).orElseThrow());
    }

    private void validateCreateRequest(GoalFormRequest request) {
        if (request.subtitles().size() > 5) {
            throw new IllegalArgumentException("サブタイトルは5個まで登録できます");
        }
        for (GoalFormRequest.Subtitle subtitle : request.subtitles()) {
            if (subtitle.items().size() > 5) {
                throw new IllegalArgumentException("1つのサブタイトルにつき項目は5個まで登録できます");
            }
        }
    }

    private void validateUpdateStructure(
            GoalFormRequest request,
            ReportItemGroup group,
            Set<UUID> subtitleIds,
            Set<UUID> definitionIds) {
        if (request.subtitles().size() > 5) {
            throw new IllegalArgumentException("サブタイトルは5個まで登録できます");
        }
        if (request.subtitles().stream().anyMatch(subtitle -> subtitle.items().size() > 5)) {
            throw new IllegalArgumentException("1つのサブタイトルにつき項目は5個まで登録できます");
        }
        if (group == null) {
            if (!request.subtitles().isEmpty()) {
                throw new IllegalArgumentException("編集時に項目を追加することはできません");
            }
            return;
        }

        if (request.subtitles().size() != subtitleIds.size()
                || request.subtitles().stream().anyMatch(subtitle -> subtitle.id() == null)) {
            throw new IllegalArgumentException("編集時はサブタイトルの追加・削除ができません");
        }

        List<ReportItemSubtitle> existingSubtitles = subtitleMapper.findByGroupId(group.getId());
        Map<UUID, List<ReportItemDefinition>> definitionsBySubtitle = new HashMap<>();
        for (ReportItemSubtitle subtitle : existingSubtitles) {
            definitionsBySubtitle.put(subtitle.getId(), definitionMapper.findBySubtitleId(subtitle.getId()));
        }

        for (int subtitleIndex = 0; subtitleIndex < request.subtitles().size(); subtitleIndex++) {
            GoalFormRequest.Subtitle subtitleRequest = request.subtitles().get(subtitleIndex);
            if (!subtitleIds.contains(subtitleRequest.id())
                    || !existingSubtitles.get(subtitleIndex).getId().equals(subtitleRequest.id())) {
                throw new IllegalArgumentException("編集時はサブタイトルの追加・削除や移動ができません");
            }
            List<ReportItemDefinition> expectedDefinitions = definitionsBySubtitle.get(subtitleRequest.id());
            if (expectedDefinitions == null
                    || subtitleRequest.items().size() != expectedDefinitions.size()) {
                throw new IllegalArgumentException("編集時は項目の追加・削除や移動ができません");
            }
            for (int itemIndex = 0; itemIndex < subtitleRequest.items().size(); itemIndex++) {
                UUID requestedId = subtitleRequest.items().get(itemIndex).id();
                if (requestedId == null
                        || !expectedDefinitions.get(itemIndex).getId().equals(requestedId)) {
                    throw new IllegalArgumentException("編集時は項目の追加・削除や移動ができません");
                }
            }
        }
    }

    private void applySubtitles(UUID studentId, UUID teacherId, ReportItemGroup group, List<GoalFormRequest.Subtitle> requested) {
        Set<UUID> retainedSubtitles = new HashSet<>();
        for (GoalFormRequest.Subtitle subtitleRequest : requested) {
            ReportItemSubtitle subtitle;
            if (subtitleRequest.id() == null) {
                var created = subtitleService.create(group.getId(), studentId, teacherId, new ReportItemSubtitleCreateRequest(subtitleRequest.label()));
                subtitle = subtitleMapper.findById(created.id()).orElseThrow();
            } else {
                subtitle = subtitleMapper.findById(subtitleRequest.id()).orElseThrow(() -> new IllegalArgumentException("サブタイトルが見つかりません"));
                subtitleService.update(subtitle.getId(), group.getId(), studentId, teacherId, new ReportItemSubtitleUpdateRequest(subtitleRequest.label()));
            }
            retainedSubtitles.add(subtitle.getId());
            applyDefinitions(studentId, teacherId, group, subtitle, subtitleRequest.items());
        }
        for (ReportItemSubtitle existing : subtitleMapper.findByGroupId(group.getId())) {
            if (!retainedSubtitles.contains(existing.getId())) {
                subtitleService.delete(existing.getId(), group.getId(), studentId, teacherId);
            }
        }
    }

    private void applyDefinitions(UUID studentId, UUID teacherId, ReportItemGroup group, ReportItemSubtitle subtitle, List<GoalFormRequest.Item> requested) {
        Set<UUID> retained = new HashSet<>();
        for (GoalFormRequest.Item itemRequest : requested) {
            if (itemRequest.id() == null) {
                var created = definitionService.create(subtitle.getId(), group.getId(), studentId, teacherId,
                        new ReportItemDefinitionCreateRequest(itemRequest.label()));
                retained.add(created.id());
            } else {
                ReportItemDefinition definition = definitionMapper.findById(itemRequest.id())
                        .orElseThrow(() -> new IllegalArgumentException("項目が見つかりません"));
                definitionService.update(definition.getId(), subtitle.getId(), group.getId(), studentId, teacherId,
                        new ReportItemDefinitionUpdateRequest(itemRequest.label()));
            }
            if (itemRequest.id() != null) retained.add(itemRequest.id());
        }
        for (ReportItemDefinition existing : definitionMapper.findBySubtitleId(subtitle.getId())) {
            if (!retained.contains(existing.getId())) {
                definitionService.delete(existing.getId(), subtitle.getId(), group.getId(), studentId, teacherId);
            }
        }
    }

    private void validateRequestIds(GoalFormRequest request, Set<UUID> subtitleIds, Set<UUID> definitionIds) {
        Set<UUID> seenSubtitles = new HashSet<>();
        Set<UUID> seenDefinitions = new HashSet<>();
        for (GoalFormRequest.Subtitle subtitle : request.subtitles()) {
            if (subtitle.id() != null && (!subtitleIds.contains(subtitle.id()) || !seenSubtitles.add(subtitle.id()))) {
                throw new IllegalArgumentException("不正なサブタイトルです");
            }
            for (GoalFormRequest.Item item : subtitle.items()) {
                if (item.id() != null && (!definitionIds.contains(item.id()) || !seenDefinitions.add(item.id()))) {
                    throw new IllegalArgumentException("不正な項目です");
                }
            }
        }
    }

    private GoalFormResponse toResponse(Goal goal) {
        ReportItemGroup group = groupMapper.findByGoalId(goal.getId()).orElse(null);
        List<GoalFormResponse.Subtitle> subtitles = group == null ? List.of() : subtitleMapper.findByGroupId(group.getId()).stream()
                .map(subtitle -> new GoalFormResponse.Subtitle(subtitle.getId(), subtitle.getLabel(),
                        definitionMapper.findBySubtitleId(subtitle.getId()).stream()
                                .map(item -> new GoalFormResponse.Item(item.getId(), item.getLabel())).toList()))
                .toList();
        return new GoalFormResponse(goal.getId(), goal.getStudentId(), group == null ? null : group.getId(), goal.getTitle(),
                goal.getDescription(), goal.getStartDate(), goal.getEndDate(), subtitles);
    }

    private Goal findGoal(UUID goalId, UUID studentId) {
        return goalMapper.findById(goalId)
                .filter(goal -> goal.getStudentId().equals(studentId))
                .orElseThrow(() -> new IllegalArgumentException("目標が見つかりません"));
    }

    private void checkOwnership(UUID studentId, UUID teacherId) {
        if (teacherId == null) {
            return;
        }
        Student student = studentMapper.findById(studentId).orElseThrow(() -> new IllegalArgumentException("生徒が見つかりません"));
        if (!teacherId.equals(student.getTeacherId())) throw new IllegalArgumentException("権限がありません");
    }
}
