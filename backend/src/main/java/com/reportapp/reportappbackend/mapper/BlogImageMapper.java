package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.BlogImage;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface BlogImageMapper {

    Optional<BlogImage> findById(@Param("id") UUID id);

    Optional<BlogImage> findByImageUrl(@Param("imageUrl") String imageUrl);

    List<BlogImage> findByBlogId(@Param("blogId") UUID blogId);

    void insert(BlogImage image);

    void deleteById(@Param("id") UUID id);

    void deleteByBlogId(@Param("blogId") UUID blogId);
}
