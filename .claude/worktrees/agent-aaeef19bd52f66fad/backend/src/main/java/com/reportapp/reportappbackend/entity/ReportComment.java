package com.reportapp.reportappbackend.entity;

import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReportComment extends BaseEntity {

    private UUID dailyReportId;

    private ActorType authorType;

    private UUID authorId;

    private String content;
}
