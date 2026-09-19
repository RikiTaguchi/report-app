package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.BlogComment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface BlogCommentMapper {

    Optional<BlogComment> findById(@Param("id") UUID id);

    List<BlogComment> findByBlogId(@Param("blogId") UUID blogId);

    int countByBlogId(@Param("blogId") UUID blogId);

    void insert(BlogComment comment);

    void update(BlogComment comment);

    void deleteById(@Param("id") UUID id);

    void deleteByBlogId(@Param("blogId") UUID blogId);
}
