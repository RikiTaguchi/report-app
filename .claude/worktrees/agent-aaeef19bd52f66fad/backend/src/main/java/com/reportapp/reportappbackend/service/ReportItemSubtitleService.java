package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.entity.ReportItemDefinition;
import com.reportapp.reportappbackend.entity.ReportItemGroup;
import com.reportapp.reportappbackend.entity.ReportItemSubtitle;
import com.reportapp.reportappbackend.entity.Student;
import com.reportapp.reportappbackend.mapper.ReportItemDefinitionMapper;
import com.reportapp.reportappbackend.mapper.ReportItemGroupMapper;
import com.reportapp.reportappbackend.mapper.ReportItemSubtitleMapper;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import com.reportapp.reportappbackend.web.dto.ReportItemSubtitleCreateRequest;
import com.reportapp.reportappbackend.web.dto.ReportItemSubtitleResponse;
import com.reportapp.reportappbackend.web.dto.ReportItemSubtitleUpdateRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportItemSubtitleService {

    private final ReportItemSubtitleMapper reportItemSubtitleMapper;
    private final ReportItemGroupMapper reportItemGroupMapper;
    private final ReportItemDefinitionMapper reportItemDefinitionMapper;
    private final StudentMapper studentMapper;

    public ReportItemSubtitleService(
            ReportItemSubtitleMapper reportItemSubtitleMapper,
            ReportItemGroupMapper reportItemGroupMapper,
            ReportItemDefinitionMapper reportItemDefinitionMapper,
            StudentMapper studentMapper) {
        this.reportItemSubtitleMapper = reportItemSubtitleMapper;
        this.reportItemGroupMapper = reportItemGroupMapper;
        this.reportItemDefinitionMapper = reportItemDefinitionMapper;
        this.studentMapper = studentMapper;
    }

    public List<ReportItemSubtitleResponse> list(UUID groupId, UUID studentId) {
        findOwnedGroup(groupId, studentId);
        return reportItemSubtitleMapper.findByGroupId(groupId).stream()
                .map(ReportItemSubtitleService::toResponse)
                .toList();
    }

    @Transactional
    public ReportItemSubtitleResponse create(
            UUID groupId, UUID studentId, UUID actingTeacherId, ReportItemSubtitleCreateRequest request) {
        checkOwnership(studentId, actingTeacherId);
        findOwnedGroup(groupId, studentId);

        ReportItemSubtitle subtitle = new ReportItemSubtitle();
        subtitle.setId(UUID.randomUUID());
        subtitle.setGroupId(groupId);
        subtitle.setLabel(request.label());
        subtitle.setDisplayOrder(reportItemSubtitleMapper.findMaxDisplayOrder(groupId) + 1);
        reportItemSubtitleMapper.insert(subtitle);
        return toResponse(reportItemSubtitleMapper.findById(subtitle.getId()).orElseThrow());
    }

    @Transactional
    public ReportItemSubtitleResponse update(
            UUID subtitleId, UUID groupId, UUID studentId, UUID actingTeacherId, ReportItemSubtitleUpdateRequest request) {
        checkOwnership(studentId, actingTeacherId);
        findOwnedGroup(groupId, studentId);
        ReportItemSubtitle subtitle = findOwnedSubtitle(subtitleId, groupId);

        subtitle.setLabel(request.label());
        reportItemSubtitleMapper.update(subtitle);
        return toResponse(reportItemSubtitleMapper.findById(subtitleId).orElseThrow());
    }

    @Transactional
    public void delete(UUID subtitleId, UUID groupId, UUID studentId, UUID actingTeacherId) {
        checkOwnership(studentId, actingTeacherId);
        findOwnedGroup(groupId, studentId);
        findOwnedSubtitle(subtitleId, groupId);

        for (ReportItemDefinition definition : reportItemDefinitionMapper.findBySubtitleId(subtitleId)) {
            if (reportItemDefinitionMapper.countResponsesByDefinitionId(definition.getId()) > 0) {
                throw new IllegalArgumentException("回答が存在するため削除できません");
            }
        }
        reportItemSubtitleMapper.deleteById(subtitleId);
    }

    private ReportItemGroup findOwnedGroup(UUID groupId, UUID studentId) {
        ReportItemGroup group =
                reportItemGroupMapper.findById(groupId).orElseThrow(() -> new IllegalArgumentException("グループが見つかりません"));
        if (!group.getStudentId().equals(studentId)) {
            throw new IllegalArgumentException("グループが見つかりません");
        }
        return group;
    }

    private ReportItemSubtitle findOwnedSubtitle(UUID subtitleId, UUID groupId) {
        ReportItemSubtitle subtitle = reportItemSubtitleMapper
                .findById(subtitleId)
                .orElseThrow(() -> new IllegalArgumentException("サブタイトルが見つかりません"));
        if (!subtitle.getGroupId().equals(groupId)) {
            throw new IllegalArgumentException("サブタイトルが見つかりません");
        }
        return subtitle;
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

    private static ReportItemSubtitleResponse toResponse(ReportItemSubtitle subtitle) {
        return new ReportItemSubtitleResponse(
                subtitle.getId(),
                subtitle.getGroupId(),
                subtitle.getLabel(),
                subtitle.getDisplayOrder(),
                subtitle.getCreatedAt(),
                subtitle.getUpdatedAt());
    }
}
