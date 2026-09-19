package com.reportapp.reportappbackend.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Subject extends BaseEntity {

    private String name;

    private Integer displayOrder;
}
