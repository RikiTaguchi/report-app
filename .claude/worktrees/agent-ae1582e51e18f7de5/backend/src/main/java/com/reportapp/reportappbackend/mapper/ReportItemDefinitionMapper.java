package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.ReportItemDefinition;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface ReportItemDefinitionMapper {

    List<ReportItemDefinition> findBySubtitleId(@Param("subtitleId") UUID subtitleId);

    List<ReportItemDefinition> findByStudentId(@Param("studentId") UUID studentId);

    List<ReportItemDefinition> findApplicableByStudentIdAndDate(
            @Param("studentId") UUID studentId, @Param("reportDate") LocalDate reportDate);

    Optional<ReportItemDefinition> findById(@Param("id") UUID id);

    void insert(ReportItemDefinition definition);

    void update(ReportItemDefinition definition);

    void deleteById(@Param("id") UUID id);

    void updateDisplayOrder(@Param("id") UUID id, @Param("displayOrder") int displayOrder);

    int countResponsesByDefinitionId(@Param("definitionId") UUID definitionId);

    int findMaxDisplayOrder(@Param("subtitleId") UUID subtitleId, @Param("itemType") String itemType);
}
