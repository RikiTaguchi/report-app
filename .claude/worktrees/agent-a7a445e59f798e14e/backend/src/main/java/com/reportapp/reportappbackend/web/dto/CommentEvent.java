package com.reportapp.reportappbackend.web.dto;

import java.util.UUID;

public record CommentEvent<T>(String eventType, UUID commentId, T comment) {

    public static <T> CommentEvent<T> created(UUID commentId, T comment) {
        return new CommentEvent<>("CREATED", commentId, comment);
    }

    public static <T> CommentEvent<T> updated(UUID commentId, T comment) {
        return new CommentEvent<>("UPDATED", commentId, comment);
    }

    public static CommentEvent<Void> deleted(UUID commentId) {
        return new CommentEvent<>("DELETED", commentId, null);
    }
}
