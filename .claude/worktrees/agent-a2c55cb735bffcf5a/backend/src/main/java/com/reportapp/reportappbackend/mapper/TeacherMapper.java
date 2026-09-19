package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.Teacher;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface TeacherMapper {

    Optional<Teacher> findByUsername(@Param("username") String username);

    Optional<Teacher> findById(@Param("id") UUID id);

    Optional<Teacher> findByProfileImageUrl(@Param("profileImageUrl") String profileImageUrl);

    List<Teacher> findAll();

    boolean existsByUsername(@Param("username") String username);

    void insert(Teacher teacher);

    void update(Teacher teacher);

    void updatePasswordHash(@Param("id") UUID id, @Param("passwordHash") String passwordHash);

    void updateProfileImageUrl(@Param("id") UUID id, @Param("profileImageUrl") String profileImageUrl);
}
