package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.ReportItemSubtitle;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface ReportItemSubtitleMapper {

    List<ReportItemSubtitle> findByGroupId(@Param("groupId") UUID groupId);

    List<ReportItemSubtitle> findByStudentId(@Param("studentId") UUID studentId);

    Optional<ReportItemSubtitle> findById(@Param("id") UUID id);

    void insert(ReportItemSubtitle subtitle);

    void update(ReportItemSubtitle subtitle);

    void deleteById(@Param("id") UUID id);

    int findMaxDisplayOrder(@Param("groupId") UUID groupId);
}
