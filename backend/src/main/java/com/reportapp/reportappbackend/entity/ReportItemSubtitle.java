package com.reportapp.reportappbackend.entity;

import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReportItemSubtitle extends BaseEntity {

    private UUID groupId;

    private String label;

    private Integer displayOrder;
}
