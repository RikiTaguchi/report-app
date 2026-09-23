package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.entity.ActorType;
import com.reportapp.reportappbackend.entity.DailyReport;
import com.reportapp.reportappbackend.entity.ReportComment;
import com.reportapp.reportappbackend.entity.ReportImage;
import com.reportapp.reportappbackend.entity.ReportLike;
import com.reportapp.reportappbackend.entity.Student;
import com.reportapp.reportappbackend.entity.Teacher;
import com.reportapp.reportappbackend.mapper.DailyReportMapper;
import com.reportapp.reportappbackend.mapper.ReportCommentMapper;
import com.reportapp.reportappbackend.mapper.ReportImageMapper;
import com.reportapp.reportappbackend.mapper.ReportLikeMapper;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import com.reportapp.reportappbackend.mapper.TeacherMapper;
import com.reportapp.reportappbackend.web.dto.CommentEvent;
import com.reportapp.reportappbackend.web.dto.ReportCommentRequest;
import com.reportapp.reportappbackend.web.dto.ReportCommentResponse;
import com.reportapp.reportappbackend.web.dto.ReportImageResponse;
import com.reportapp.reportappbackend.web.dto.ReportLikeStatusResponse;
import com.reportapp.reportappbackend.websocket.RealtimeTopics;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ReportSocialService {

    private final DailyReportMapper dailyReportMapper;
    private final ReportCommentMapper reportCommentMapper;
    private final ReportLikeMapper reportLikeMapper;
    private final ReportImageMapper reportImageMapper;
    private final TeacherMapper teacherMapper;
    private final StudentMapper studentMapper;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;

    public ReportSocialService(
            DailyReportMapper dailyReportMapper,
            ReportCommentMapper reportCommentMapper,
            ReportLikeMapper reportLikeMapper,
            ReportImageMapper reportImageMapper,
            TeacherMapper teacherMapper,
            StudentMapper studentMapper,
            FileStorageService fileStorageService,
            SimpMessagingTemplate messagingTemplate) {
        this.dailyReportMapper = dailyReportMapper;
        this.reportCommentMapper = reportCommentMapper;
        this.reportLikeMapper = reportLikeMapper;
        this.reportImageMapper = reportImageMapper;
        this.teacherMapper = teacherMapper;
        this.studentMapper = studentMapper;
        this.fileStorageService = fileStorageService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public ReportCommentResponse createCommentAsTeacher(
            UUID studentId, LocalDate reportDate, UUID teacherId, ReportCommentRequest request) {
        return createComment(studentId, reportDate, ActorType.TEACHER, teacherId, request);
    }

    @Transactional
    public ReportCommentResponse createCommentAsStudent(
            UUID studentId, LocalDate reportDate, UUID authorStudentId, ReportCommentRequest request) {
        if (!studentId.equals(authorStudentId)) {
            throw new IllegalArgumentException("権限がありません");
        }
        return createComment(studentId, reportDate, ActorType.STUDENT, authorStudentId, request);
    }

    private ReportCommentResponse createComment(
            UUID studentId, LocalDate reportDate, ActorType authorType, UUID authorId, ReportCommentRequest request) {
        UUID dailyReportId = requireVisibleDailyReportId(studentId, reportDate);
        ReportComment comment = new ReportComment();
        comment.setId(UUID.randomUUID());
        comment.setDailyReportId(dailyReportId);
        comment.setAuthorType(authorType);
        comment.setAuthorId(authorId);
        comment.setContent(request.content());
        reportCommentMapper.insert(comment);
        ReportCommentResponse response = toCommentResponse(reportCommentMapper.findById(comment.getId()).orElseThrow());
        messagingTemplate.convertAndSend(
                RealtimeTopics.reportComments(studentId, reportDate), CommentEvent.created(response.id(), response));
        return response;
    }

    @Transactional
    public ReportCommentResponse updateCommentAsAuthor(
            UUID commentId, ActorType authorType, UUID authorId, ReportCommentRequest request) {
        ReportComment comment = requireAuthoredComment(commentId, authorType, authorId);
        comment.setContent(request.content());
        reportCommentMapper.update(comment);
        ReportCommentResponse response = toCommentResponse(reportCommentMapper.findById(commentId).orElseThrow());
        DailyReport report = dailyReportMapper.findById(comment.getDailyReportId()).orElseThrow();
        messagingTemplate.convertAndSend(
                RealtimeTopics.reportComments(report.getStudentId(), report.getReportDate()),
                CommentEvent.updated(commentId, response));
        return response;
    }

    @Transactional
    public void deleteCommentAsAuthor(UUID commentId, ActorType authorType, UUID authorId) {
        ReportComment comment = requireAuthoredComment(commentId, authorType, authorId);
        reportCommentMapper.deleteById(commentId);
        DailyReport report = dailyReportMapper.findById(comment.getDailyReportId()).orElseThrow();
        messagingTemplate.convertAndSend(
                RealtimeTopics.reportComments(report.getStudentId(), report.getReportDate()),
                CommentEvent.deleted(commentId));
    }

    @Transactional
    public void deleteCommentAsAdmin(UUID commentId) {
        ReportComment comment = reportCommentMapper
                .findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("コメントが見つかりません"));
        reportCommentMapper.deleteById(commentId);
        DailyReport report = dailyReportMapper.findById(comment.getDailyReportId()).orElseThrow();
        messagingTemplate.convertAndSend(
                RealtimeTopics.reportComments(report.getStudentId(), report.getReportDate()),
                CommentEvent.deleted(commentId));
    }

    public List<ReportCommentResponse> listComments(UUID studentId, LocalDate reportDate) {
        Optional<UUID> dailyReportId = findDailyReportId(studentId, reportDate);
        if (dailyReportId.isEmpty()) {
            return List.of();
        }
        return reportCommentMapper.findByDailyReportId(dailyReportId.get()).stream()
                .map(this::toCommentResponse)
                .toList();
    }

    public List<ReportCommentResponse> listCommentsForTeacher(UUID studentId, LocalDate reportDate) {
        if (findVisibleDailyReportId(studentId, reportDate).isEmpty()) {
            return List.of();
        }
        return listComments(studentId, reportDate);
    }

    @Transactional
    public void likeReport(UUID studentId, LocalDate reportDate, ActorType likerType, UUID likerId) {
        UUID dailyReportId = requireVisibleDailyReportId(studentId, reportDate);
        if (reportLikeMapper.findByDailyReportIdAndLiker(dailyReportId, likerType, likerId).isPresent()) {
            throw new IllegalArgumentException("既にいいね済みです");
        }
        ReportLike like = new ReportLike();
        like.setId(UUID.randomUUID());
        like.setDailyReportId(dailyReportId);
        like.setLikerType(likerType);
        like.setLikerId(likerId);
        reportLikeMapper.insert(like);
    }

    @Transactional
    public void unlikeReport(UUID studentId, LocalDate reportDate, ActorType likerType, UUID likerId) {
        UUID dailyReportId = requireVisibleDailyReportId(studentId, reportDate);
        if (reportLikeMapper.findByDailyReportIdAndLiker(dailyReportId, likerType, likerId).isEmpty()) {
            throw new IllegalArgumentException("いいね済みではありません");
        }
        reportLikeMapper.deleteByDailyReportIdAndLiker(dailyReportId, likerType, likerId);
    }

    public ReportLikeStatusResponse getLikeStatus(
            UUID studentId, LocalDate reportDate, ActorType likerType, UUID likerId) {
        Optional<UUID> dailyReportId = findVisibleDailyReportId(studentId, reportDate);
        if (dailyReportId.isEmpty()) {
            return new ReportLikeStatusResponse(false, 0);
        }
        boolean liked = reportLikeMapper
                .findByDailyReportIdAndLiker(dailyReportId.get(), likerType, likerId)
                .isPresent();
        int count = reportLikeMapper.countByDailyReportId(dailyReportId.get());
        return new ReportLikeStatusResponse(liked, count);
    }

    @Transactional
    public ReportImageResponse uploadImage(UUID studentId, LocalDate reportDate, MultipartFile file) {
        Optional<UUID> existingDailyReportId = findDailyReportId(studentId, reportDate);
        if (existingDailyReportId.isPresent()
                && reportImageMapper.findByDailyReportId(existingDailyReportId.get()).size() >= 5) {
            throw new IllegalArgumentException("画像は5枚まで登録できます");
        }
        UUID dailyReportId = resolveOrCreateDailyReportId(studentId, reportDate);
        String imageUrl = fileStorageService.saveFile(file);
        ReportImage image = new ReportImage();
        image.setId(UUID.randomUUID());
        image.setDailyReportId(dailyReportId);
        image.setImageUrl(imageUrl);
        reportImageMapper.insert(image);
        return toImageResponse(reportImageMapper.findById(image.getId()).orElseThrow());
    }

    @Transactional
    public void deleteImage(UUID studentId, UUID imageId) {
        ReportImage image = reportImageMapper
                .findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("画像が見つかりません"));
        DailyReport report = dailyReportMapper
                .findById(image.getDailyReportId())
                .orElseThrow(() -> new IllegalArgumentException("画像が見つかりません"));
        if (!report.getStudentId().equals(studentId)) {
            throw new IllegalArgumentException("権限がありません");
        }
        fileStorageService.deleteFile(image.getImageUrl());
        reportImageMapper.deleteById(imageId);
    }

    public List<ReportImageResponse> listImages(UUID studentId, LocalDate reportDate) {
        Optional<UUID> dailyReportId = findDailyReportId(studentId, reportDate);
        if (dailyReportId.isEmpty()) {
            return List.of();
        }
        return reportImageMapper.findByDailyReportId(dailyReportId.get()).stream()
                .map(this::toImageResponse)
                .toList();
    }

    public List<ReportImageResponse> listImagesForTeacher(UUID studentId, LocalDate reportDate) {
        if (findVisibleDailyReportId(studentId, reportDate).isEmpty()) {
            return List.of();
        }
        return listImages(studentId, reportDate);
    }

    private Optional<UUID> findDailyReportId(UUID studentId, LocalDate reportDate) {
        return dailyReportMapper
                .findByStudentIdAndReportDate(studentId, reportDate)
                .map(DailyReport::getId);
    }

    private Optional<UUID> findVisibleDailyReportId(UUID studentId, LocalDate reportDate) {
        return dailyReportMapper
                .findByStudentIdAndReportDate(studentId, reportDate)
                .filter(report -> report.getSubmittedAt() != null)
                .map(DailyReport::getId);
    }

    private UUID requireVisibleDailyReportId(UUID studentId, LocalDate reportDate) {
        return findVisibleDailyReportId(studentId, reportDate)
                .orElseThrow(() -> new IllegalArgumentException("日報が見つかりません"));
    }

    private UUID resolveOrCreateDailyReportId(UUID studentId, LocalDate reportDate) {
        DailyReport report = dailyReportMapper.findByStudentIdAndReportDate(studentId, reportDate).orElse(null);
        if (report != null) {
            return report.getId();
        }
        report = new DailyReport();
        report.setId(UUID.randomUUID());
        report.setStudentId(studentId);
        report.setReportDate(reportDate);
        dailyReportMapper.insert(report);
        return report.getId();
    }

    private ReportComment requireAuthoredComment(UUID commentId, ActorType authorType, UUID authorId) {
        ReportComment comment = reportCommentMapper
                .findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("コメントが見つかりません"));
        if (comment.getAuthorType() != authorType || !comment.getAuthorId().equals(authorId)) {
            throw new IllegalArgumentException("権限がありません");
        }
        return comment;
    }

    private ReportCommentResponse toCommentResponse(ReportComment comment) {
        String authorName;
        String authorProfileImageUrl;
        switch (comment.getAuthorType()) {
            case TEACHER -> {
                Optional<Teacher> author = teacherMapper.findById(comment.getAuthorId());
                authorName = author.map(Teacher::getName).orElse(null);
                authorProfileImageUrl = author.map(Teacher::getProfileImageUrl).orElse(null);
            }
            case STUDENT -> {
                Optional<Student> author = studentMapper.findById(comment.getAuthorId());
                authorName = author.map(Student::getName).orElse(null);
                authorProfileImageUrl = author.map(Student::getProfileImageUrl).orElse(null);
            }
            default -> throw new IllegalStateException("不明な投稿者種別です");
        }
        return new ReportCommentResponse(
                comment.getId(),
                comment.getAuthorType().name(),
                comment.getAuthorId(),
                authorName,
                authorProfileImageUrl,
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt());
    }

    private ReportImageResponse toImageResponse(ReportImage image) {
        return new ReportImageResponse(image.getId(), image.getImageUrl(), image.getCreatedAt());
    }
}
