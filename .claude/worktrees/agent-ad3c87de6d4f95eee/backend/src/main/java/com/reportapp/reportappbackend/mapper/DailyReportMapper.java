package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.DailyReport;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface DailyReportMapper {

    Optional<DailyReport> findByStudentIdAndReportDate(
            @Param("studentId") UUID studentId, @Param("reportDate") LocalDate reportDate);

    Optional<DailyReport> findById(@Param("id") UUID id);

    List<DailyReport> findByStudentId(@Param("studentId") UUID studentId);

    List<LocalDate> findSubmissionDatesByStudentId(@Param("studentId") UUID studentId);

    void insert(DailyReport dailyReport);

    void updateFreeText(@Param("id") UUID id, @Param("freeText") String freeText);

    void markSubmitted(@Param("id") UUID id, @Param("submittedAt") LocalDateTime submittedAt);

    void deleteById(@Param("id") UUID id);
}
