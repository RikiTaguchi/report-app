package com.reportapp.reportappbackend.web.dto;

import java.util.UUID;

public record StudyTimeRecordDTO(UUID subjectId, String subjectName, Integer minutes) {
}
