package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.ReportComment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface ReportCommentMapper {

    Optional<ReportComment> findById(@Param("id") UUID id);

    List<ReportComment> findByDailyReportId(@Param("dailyReportId") UUID dailyReportId);

    void insert(ReportComment comment);

    void update(ReportComment comment);

    void deleteById(@Param("id") UUID id);
}
