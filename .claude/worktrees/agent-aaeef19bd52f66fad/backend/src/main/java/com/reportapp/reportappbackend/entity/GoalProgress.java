package com.reportapp.reportappbackend.entity;

import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GoalProgress extends BaseEntity {

    private UUID goalId;

    private Integer progressPercent;

    private String comment;

    private LocalDate recordedDate;
}
