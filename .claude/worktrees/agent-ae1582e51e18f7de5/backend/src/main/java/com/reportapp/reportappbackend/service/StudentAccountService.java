package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.entity.Student;
import com.reportapp.reportappbackend.entity.Teacher;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import com.reportapp.reportappbackend.mapper.TeacherMapper;
import com.reportapp.reportappbackend.web.dto.PasswordResetRequest;
import com.reportapp.reportappbackend.web.dto.StudentCreateRequest;
import com.reportapp.reportappbackend.web.dto.StudentProfileImageResponse;
import com.reportapp.reportappbackend.web.dto.StudentResponse;
import com.reportapp.reportappbackend.web.dto.StudentUpdateRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class StudentAccountService {

    private final StudentMapper studentMapper;
    private final TeacherMapper teacherMapper;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    public StudentAccountService(
            StudentMapper studentMapper,
            TeacherMapper teacherMapper,
            PasswordEncoder passwordEncoder,
            FileStorageService fileStorageService) {
        this.studentMapper = studentMapper;
        this.teacherMapper = teacherMapper;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
    }

    public List<StudentResponse> list() {
        return studentMapper.findAll().stream().map(this::toResponse).toList();
    }

    public List<StudentResponse> listByTeacherId(UUID teacherId) {
        return studentMapper.findByTeacherId(teacherId).stream().map(this::toResponse).toList();
    }

    public StudentResponse get(UUID id) {
        return toResponse(studentMapper.findById(id).orElseThrow(() -> new IllegalArgumentException("生徒が見つかりません")));
    }

    @Transactional
    public StudentResponse create(StudentCreateRequest request) {
        if (studentMapper.existsByUsername(request.username())) {
            throw new IllegalArgumentException("このユーザー名は既に使用されています");
        }
        teacherMapper.findById(request.teacherId()).orElseThrow(() -> new IllegalArgumentException("講師が見つかりません"));
        Student student = new Student();
        student.setId(UUID.randomUUID());
        student.setUsername(request.username());
        student.setPasswordHash(passwordEncoder.encode(request.password()));
        student.setLastName(request.lastName());
        student.setFirstName(request.firstName());
        student.setTeacherId(request.teacherId());
        studentMapper.insert(student);
        return toResponse(studentMapper.findById(student.getId()).orElseThrow());
    }

    @Transactional
    public StudentResponse update(UUID id, StudentUpdateRequest request) {
        Student student =
                studentMapper.findById(id).orElseThrow(() -> new IllegalArgumentException("生徒が見つかりません"));
        teacherMapper.findById(request.teacherId()).orElseThrow(() -> new IllegalArgumentException("講師が見つかりません"));
        student.setLastName(request.lastName());
        student.setFirstName(request.firstName());
        student.setTeacherId(request.teacherId());
        studentMapper.update(student);
        return toResponse(studentMapper.findById(id).orElseThrow());
    }

    @Transactional
    public void resetPassword(UUID id, PasswordResetRequest request) {
        studentMapper.findById(id).orElseThrow(() -> new IllegalArgumentException("生徒が見つかりません"));
        studentMapper.updatePasswordHash(id, passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public StudentProfileImageResponse updateProfileImage(UUID studentId, MultipartFile file) {
        Student student =
                studentMapper.findById(studentId).orElseThrow(() -> new IllegalArgumentException("生徒が見つかりません"));
        String newImageUrl = fileStorageService.saveFile(file);
        if (student.getProfileImageUrl() != null) {
            fileStorageService.deleteFile(student.getProfileImageUrl());
        }
        studentMapper.updateProfileImageUrl(studentId, newImageUrl);
        return new StudentProfileImageResponse(newImageUrl);
    }

    @Transactional
    public StudentProfileImageResponse deleteProfileImage(UUID studentId) {
        Student student =
                studentMapper.findById(studentId).orElseThrow(() -> new IllegalArgumentException("生徒が見つかりません"));
        if (student.getProfileImageUrl() != null) {
            fileStorageService.deleteFile(student.getProfileImageUrl());
        }
        studentMapper.updateProfileImageUrl(studentId, null);
        return new StudentProfileImageResponse(null);
    }

    @Transactional
    public void delete(UUID id) {
        studentMapper.findById(id).orElseThrow(() -> new IllegalArgumentException("生徒が見つかりません"));
        studentMapper.deleteById(id);
    }

    private StudentResponse toResponse(Student student) {
        String teacherName =
                teacherMapper.findById(student.getTeacherId()).map(Teacher::getName).orElse(null);
        return new StudentResponse(
                student.getId(),
                student.getUsername(),
                student.getName(),
                student.getLastName(),
                student.getFirstName(),
                student.getTeacherId(),
                teacherName,
                student.getCreatedAt(),
                student.getUpdatedAt());
    }
}
