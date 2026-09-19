package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.ReportImage;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface ReportImageMapper {

    Optional<ReportImage> findById(@Param("id") UUID id);

    Optional<ReportImage> findByImageUrl(@Param("imageUrl") String imageUrl);

    List<ReportImage> findByDailyReportId(@Param("dailyReportId") UUID dailyReportId);

    void insert(ReportImage image);

    void deleteById(@Param("id") UUID id);
}
