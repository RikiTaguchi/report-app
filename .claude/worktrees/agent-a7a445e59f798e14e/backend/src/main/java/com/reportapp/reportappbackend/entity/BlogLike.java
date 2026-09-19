package com.reportapp.reportappbackend.entity;

import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BlogLike extends BaseEntity {

    private UUID blogId;

    private ActorType likerType;

    private UUID likerId;
}
