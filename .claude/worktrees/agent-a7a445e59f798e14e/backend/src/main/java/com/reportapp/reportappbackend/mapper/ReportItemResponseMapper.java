package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.ReportItemResponse;
import java.util.List;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface ReportItemResponseMapper {

    List<ReportItemResponse> findByDailyReportId(@Param("dailyReportId") UUID dailyReportId);

    void deleteByDailyReportId(@Param("dailyReportId") UUID dailyReportId);

    void insertBatch(@Param("items") List<ReportItemResponse> items);
}
