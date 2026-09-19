package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.ReportItemGroup;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface ReportItemGroupMapper {

    List<ReportItemGroup> findByStudentId(@Param("studentId") UUID studentId);

    Optional<ReportItemGroup> findById(@Param("id") UUID id);

    Optional<ReportItemGroup> findByGoalId(@Param("goalId") UUID goalId);

    void insert(ReportItemGroup group);

    void deleteById(@Param("id") UUID id);
}
