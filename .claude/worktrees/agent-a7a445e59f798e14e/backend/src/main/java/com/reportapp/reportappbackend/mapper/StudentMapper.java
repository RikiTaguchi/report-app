package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.Student;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface StudentMapper {

    Optional<Student> findByUsername(@Param("username") String username);

    Optional<Student> findById(@Param("id") UUID id);

    Optional<Student> findByProfileImageUrl(@Param("profileImageUrl") String profileImageUrl);

    List<Student> findAll();

    List<Student> findByTeacherId(@Param("teacherId") UUID teacherId);

    boolean existsByUsername(@Param("username") String username);

    void insert(Student student);

    void update(Student student);

    void updatePasswordHash(@Param("id") UUID id, @Param("passwordHash") String passwordHash);

    void updateProfileImageUrl(@Param("id") UUID id, @Param("profileImageUrl") String profileImageUrl);

    void deleteById(@Param("id") UUID id);
}
