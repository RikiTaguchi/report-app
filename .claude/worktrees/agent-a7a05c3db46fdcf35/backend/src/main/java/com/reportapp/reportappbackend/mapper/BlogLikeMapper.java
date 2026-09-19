package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.ActorType;
import com.reportapp.reportappbackend.entity.BlogLike;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface BlogLikeMapper {

    Optional<BlogLike> findByBlogIdAndLiker(
            @Param("blogId") UUID blogId,
            @Param("likerType") ActorType likerType,
            @Param("likerId") UUID likerId);

    int countByBlogId(@Param("blogId") UUID blogId);

    void insert(BlogLike like);

    void deleteByBlogIdAndLiker(
            @Param("blogId") UUID blogId,
            @Param("likerType") ActorType likerType,
            @Param("likerId") UUID likerId);

    void deleteByBlogId(@Param("blogId") UUID blogId);
}
