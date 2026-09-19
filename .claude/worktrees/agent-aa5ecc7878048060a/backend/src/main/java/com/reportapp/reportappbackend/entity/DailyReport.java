package com.reportapp.reportappbackend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DailyReport extends BaseEntity {

    private UUID studentId;

    private LocalDate reportDate;

    private LocalDateTime submittedAt;

    private String freeText;
}
