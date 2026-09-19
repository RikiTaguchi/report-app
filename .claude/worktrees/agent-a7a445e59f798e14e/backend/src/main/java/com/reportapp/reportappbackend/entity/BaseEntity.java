package com.reportapp.reportappbackend.entity;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public abstract class BaseEntity {

    private UUID id;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
