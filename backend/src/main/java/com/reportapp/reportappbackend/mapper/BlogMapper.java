package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.Blog;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface BlogMapper {

    Optional<Blog> findById(@Param("id") UUID id);

    List<Blog> findByTeacherId(@Param("teacherId") UUID teacherId);

    List<Blog> findAll();

    void insert(Blog blog);

    void update(Blog blog);

    void deleteById(@Param("id") UUID id);
}
