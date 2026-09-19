package com.reportapp.reportappbackend.entity;

import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Goal extends BaseEntity {

    private UUID studentId;

    private UUID teacherId;

    private String title;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;
}
