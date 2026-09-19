package com.reportapp.reportappbackend.entity;

import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReportLike extends BaseEntity {

    private UUID dailyReportId;

    private ActorType likerType;

    private UUID likerId;
}
