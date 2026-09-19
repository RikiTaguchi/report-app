package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.StudyTimeRecord;
import com.reportapp.reportappbackend.web.dto.StudyTimeRecordDTO;
import java.util.List;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface StudyTimeRecordMapper {

    List<StudyTimeRecord> findByDailyReportId(@Param("dailyReportId") UUID dailyReportId);

    void deleteByDailyReportId(@Param("dailyReportId") UUID dailyReportId);

    void insertBatch(@Param("records") List<StudyTimeRecord> records);

    List<StudyTimeRecordDTO> sumByStudentIdGroupedBySubject(@Param("studentId") UUID studentId);
}
