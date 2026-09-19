package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.ActorType;
import com.reportapp.reportappbackend.entity.ReportLike;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface ReportLikeMapper {

    Optional<ReportLike> findByDailyReportIdAndLiker(
            @Param("dailyReportId") UUID dailyReportId,
            @Param("likerType") ActorType likerType,
            @Param("likerId") UUID likerId);

    int countByDailyReportId(@Param("dailyReportId") UUID dailyReportId);

    void insert(ReportLike like);

    void deleteByDailyReportIdAndLiker(
            @Param("dailyReportId") UUID dailyReportId,
            @Param("likerType") ActorType likerType,
            @Param("likerId") UUID likerId);
}
