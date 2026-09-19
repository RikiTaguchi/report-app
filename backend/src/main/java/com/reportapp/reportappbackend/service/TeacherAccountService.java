package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.entity.Blog;
import com.reportapp.reportappbackend.entity.Teacher;
import com.reportapp.reportappbackend.mapper.GoalMapper;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import com.reportapp.reportappbackend.mapper.TeacherMapper;
import com.reportapp.reportappbackend.web.dto.PasswordResetRequest;
import com.reportapp.reportappbackend.web.dto.TeacherCreateRequest;
import com.reportapp.reportappbackend.web.dto.TeacherProfileImageResponse;
import com.reportapp.reportappbackend.web.dto.TeacherResponse;
import com.reportapp.reportappbackend.web.dto.TeacherUpdateRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class TeacherAccountService {

    private final TeacherMapper teacherMapper;
    private final StudentMapper studentMapper;
    private final GoalMapper goalMapper;
    private final BlogService blogService;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    public TeacherAccountService(
            TeacherMapper teacherMapper,
            StudentMapper studentMapper,
            GoalMapper goalMapper,
            BlogService blogService,
            PasswordEncoder passwordEncoder,
            FileStorageService fileStorageService) {
        this.teacherMapper = teacherMapper;
        this.studentMapper = studentMapper;
        this.goalMapper = goalMapper;
        this.blogService = blogService;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
    }

    public List<TeacherResponse> list() {
        return teacherMapper.findAll().stream().map(this::toResponse).toList();
    }

    public TeacherResponse get(UUID id) {
        return toResponse(teacherMapper.findById(id).orElseThrow(() -> new IllegalArgumentException("講師が見つかりません")));
    }

    @Transactional
    public TeacherResponse create(TeacherCreateRequest request) {
        if (teacherMapper.existsByUsername(request.username())) {
            throw new IllegalArgumentException("このユーザー名は既に使用されています");
        }
        Teacher teacher = new Teacher();
        teacher.setId(UUID.randomUUID());
        teacher.setUsername(request.username());
        teacher.setPasswordHash(passwordEncoder.encode(request.password()));
        teacher.setLastName(request.lastName());
        teacher.setFirstName(request.firstName());
        teacherMapper.insert(teacher);
        return toResponse(teacherMapper.findById(teacher.getId()).orElseThrow());
    }

    @Transactional
    public TeacherResponse update(UUID id, TeacherUpdateRequest request) {
        Teacher teacher =
                teacherMapper.findById(id).orElseThrow(() -> new IllegalArgumentException("講師が見つかりません"));
        teacher.setLastName(request.lastName());
        teacher.setFirstName(request.firstName());
        teacherMapper.update(teacher);
        return toResponse(teacherMapper.findById(id).orElseThrow());
    }

    @Transactional
    public void resetPassword(UUID id, PasswordResetRequest request) {
        teacherMapper.findById(id).orElseThrow(() -> new IllegalArgumentException("講師が見つかりません"));
        teacherMapper.updatePasswordHash(id, passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public TeacherProfileImageResponse updateProfileImage(UUID teacherId, MultipartFile file) {
        Teacher teacher =
                teacherMapper.findById(teacherId).orElseThrow(() -> new IllegalArgumentException("講師が見つかりません"));
        String newImageUrl = fileStorageService.saveFile(file);
        if (teacher.getProfileImageUrl() != null) {
            fileStorageService.deleteFile(teacher.getProfileImageUrl());
        }
        teacherMapper.updateProfileImageUrl(teacherId, newImageUrl);
        return new TeacherProfileImageResponse(newImageUrl);
    }

    @Transactional
    public void delete(UUID id) {
        Teacher teacher =
                teacherMapper.findById(id).orElseThrow(() -> new IllegalArgumentException("講師が見つかりません"));
        if (!studentMapper.findByTeacherId(id).isEmpty()) {
            throw new IllegalArgumentException("担当生徒がいる講師は削除できません。先に担当を付け替えてください");
        }
        goalMapper.repointToCurrentStudentTeacher(id);
        if (goalMapper.countByTeacherId(id) > 0) {
            throw new IllegalArgumentException("この講師に紐づく目標が残っているため削除できません");
        }
        for (Blog blog : blogService.listEntitiesByTeacherId(id)) {
            blogService.delete(blog.getId(), null);
        }
        if (teacher.getProfileImageUrl() != null) {
            fileStorageService.deleteFile(teacher.getProfileImageUrl());
        }
        teacherMapper.deleteById(id);
    }

    @Transactional
    public TeacherProfileImageResponse deleteProfileImage(UUID teacherId) {
        Teacher teacher =
                teacherMapper.findById(teacherId).orElseThrow(() -> new IllegalArgumentException("講師が見つかりません"));
        if (teacher.getProfileImageUrl() != null) {
            fileStorageService.deleteFile(teacher.getProfileImageUrl());
        }
        teacherMapper.updateProfileImageUrl(teacherId, null);
        return new TeacherProfileImageResponse(null);
    }

    private TeacherResponse toResponse(Teacher teacher) {
        return new TeacherResponse(
                teacher.getId(),
                teacher.getUsername(),
                teacher.getName(),
                teacher.getLastName(),
                teacher.getFirstName(),
                teacher.getProfileImageUrl(),
                teacher.getCreatedAt(),
                teacher.getUpdatedAt());
    }
}
