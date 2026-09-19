package com.reportapp.reportappbackend.entity;

import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReportItemDefinition extends BaseEntity {

    private UUID subtitleId;

    private ReportItemType itemType;

    private String label;

    private Integer displayOrder;
}
