package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.entity.Teacher;
import com.reportapp.reportappbackend.mapper.TeacherMapper;
import com.reportapp.reportappbackend.web.dto.PasswordResetRequest;
import com.reportapp.reportappbackend.web.dto.TeacherCreateRequest;
import com.reportapp.reportappbackend.web.dto.TeacherResponse;
import com.reportapp.reportappbackend.web.dto.TeacherUpdateRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TeacherAccountService {

    private final TeacherMapper teacherMapper;
    private final PasswordEncoder passwordEncoder;

    public TeacherAccountService(TeacherMapper teacherMapper, PasswordEncoder passwordEncoder) {
        this.teacherMapper = teacherMapper;
        this.passwordEncoder = passwordEncoder;
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

    private TeacherResponse toResponse(Teacher teacher) {
        return new TeacherResponse(
                teacher.getId(),
                teacher.getUsername(),
                teacher.getName(),
                teacher.getLastName(),
                teacher.getFirstName(),
                teacher.getCreatedAt(),
                teacher.getUpdatedAt());
    }
}
