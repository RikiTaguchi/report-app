package com.reportapp.reportappbackend.entity;

import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BlogComment extends BaseEntity {

    private UUID blogId;

    private ActorType authorType;

    private UUID authorId;

    private String content;

    private UUID parentCommentId;
}
