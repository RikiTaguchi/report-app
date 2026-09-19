package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.entity.ActorType;
import com.reportapp.reportappbackend.entity.Blog;
import com.reportapp.reportappbackend.entity.BlogComment;
import com.reportapp.reportappbackend.entity.BlogImage;
import com.reportapp.reportappbackend.entity.BlogLike;
import com.reportapp.reportappbackend.entity.Student;
import com.reportapp.reportappbackend.entity.Teacher;
import com.reportapp.reportappbackend.mapper.BlogCommentMapper;
import com.reportapp.reportappbackend.mapper.BlogImageMapper;
import com.reportapp.reportappbackend.mapper.BlogLikeMapper;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import com.reportapp.reportappbackend.mapper.TeacherMapper;
import com.reportapp.reportappbackend.web.dto.BlogCommentRequest;
import com.reportapp.reportappbackend.web.dto.BlogCommentResponse;
import com.reportapp.reportappbackend.web.dto.BlogImageResponse;
import com.reportapp.reportappbackend.web.dto.CommentEvent;
import com.reportapp.reportappbackend.web.dto.ReportLikeCountResponse;
import com.reportapp.reportappbackend.web.dto.ReportLikeStatusResponse;
import com.reportapp.reportappbackend.websocket.RealtimeTopics;
import java.util.List;
import java.util.UUID;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class BlogSocialService {

    private final BlogService blogService;
    private final BlogImageMapper blogImageMapper;
    private final BlogCommentMapper blogCommentMapper;
    private final BlogLikeMapper blogLikeMapper;
    private final TeacherMapper teacherMapper;
    private final StudentMapper studentMapper;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;

    public BlogSocialService(
            BlogService blogService,
            BlogImageMapper blogImageMapper,
            BlogCommentMapper blogCommentMapper,
            BlogLikeMapper blogLikeMapper,
            TeacherMapper teacherMapper,
            StudentMapper studentMapper,
            FileStorageService fileStorageService,
            SimpMessagingTemplate messagingTemplate) {
        this.blogService = blogService;
        this.blogImageMapper = blogImageMapper;
        this.blogCommentMapper = blogCommentMapper;
        this.blogLikeMapper = blogLikeMapper;
        this.teacherMapper = teacherMapper;
        this.studentMapper = studentMapper;
        this.fileStorageService = fileStorageService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public BlogImageResponse uploadImage(UUID blogId, UUID teacherId, MultipartFile file) {
        blogService.requireOwned(blogId, teacherId);
        if (blogImageMapper.findByBlogId(blogId).size() >= 5) {
            throw new IllegalArgumentException("画像は5枚まで登録できます");
        }
        String imageUrl = fileStorageService.saveFile(file);
        BlogImage image = new BlogImage();
        image.setId(UUID.randomUUID());
        image.setBlogId(blogId);
        image.setImageUrl(imageUrl);
        blogImageMapper.insert(image);
        return toImageResponse(blogImageMapper.findById(image.getId()).orElseThrow());
    }

    @Transactional
    public void deleteImage(UUID imageId, UUID blogId, UUID teacherId) {
        blogService.requireOwned(blogId, teacherId);
        BlogImage image =
                blogImageMapper.findById(imageId).orElseThrow(() -> new IllegalArgumentException("画像が見つかりません"));
        if (!image.getBlogId().equals(blogId)) {
            throw new IllegalArgumentException("画像が見つかりません");
        }
        fileStorageService.deleteFile(image.getImageUrl());
        blogImageMapper.deleteById(imageId);
    }

    public List<BlogImageResponse> listImagesForTeacher(UUID blogId, UUID teacherId) {
        blogService.requireVisibleForTeacher(blogId, teacherId);
        return blogImageMapper.findByBlogId(blogId).stream().map(this::toImageResponse).toList();
    }

    public List<BlogImageResponse> listImagesForStudent(UUID blogId) {
        blogService.requireVisibleForStudent(blogId);
        return blogImageMapper.findByBlogId(blogId).stream().map(this::toImageResponse).toList();
    }

    @Transactional
    public BlogCommentResponse createCommentAsTeacher(
            UUID blogId, UUID teacherId, BlogCommentRequest request) {
        blogService.requireVisibleForTeacher(blogId, teacherId);
        return createComment(blogId, ActorType.TEACHER, teacherId, request);
    }

    @Transactional
    public BlogCommentResponse createCommentAsStudent(UUID blogId, UUID studentId, BlogCommentRequest request) {
        blogService.requireVisibleForStudent(blogId);
        return createComment(blogId, ActorType.STUDENT, studentId, request);
    }

    private BlogCommentResponse createComment(
            UUID blogId, ActorType authorType, UUID authorId, BlogCommentRequest request) {
        Blog blog = blogService.findBlogEntity(blogId);

        if (request.parentCommentId() != null) {
            BlogComment parent = blogCommentMapper
                    .findById(request.parentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("親コメントが見つかりません"));
            if (!parent.getBlogId().equals(blog.getId())) {
                throw new IllegalArgumentException("親コメントが見つかりません");
            }
        }

        BlogComment comment = new BlogComment();
        comment.setId(UUID.randomUUID());
        comment.setBlogId(blogId);
        comment.setAuthorType(authorType);
        comment.setAuthorId(authorId);
        comment.setContent(request.content());
        comment.setParentCommentId(request.parentCommentId());
        blogCommentMapper.insert(comment);
        BlogCommentResponse response = toCommentResponse(blogCommentMapper.findById(comment.getId()).orElseThrow());
        messagingTemplate.convertAndSend(
                RealtimeTopics.blogComments(blogId), CommentEvent.created(response.id(), response));
        return response;
    }

    @Transactional
    public BlogCommentResponse updateCommentAsAuthor(
            UUID commentId, ActorType authorType, UUID authorId, BlogCommentRequest request) {
        BlogComment comment = requireAuthoredComment(commentId, authorType, authorId);
        comment.setContent(request.content());
        blogCommentMapper.update(comment);
        BlogCommentResponse response = toCommentResponse(blogCommentMapper.findById(commentId).orElseThrow());
        messagingTemplate.convertAndSend(
                RealtimeTopics.blogComments(comment.getBlogId()), CommentEvent.updated(commentId, response));
        return response;
    }

    @Transactional
    public void deleteCommentAsAuthor(UUID commentId, ActorType authorType, UUID authorId) {
        BlogComment comment = requireAuthoredComment(commentId, authorType, authorId);
        blogCommentMapper.deleteById(commentId);
        messagingTemplate.convertAndSend(
                RealtimeTopics.blogComments(comment.getBlogId()), CommentEvent.deleted(commentId));
    }

    @Transactional
    public void deleteCommentAsAdmin(UUID commentId) {
        BlogComment comment =
                blogCommentMapper.findById(commentId).orElseThrow(() -> new IllegalArgumentException("コメントが見つかりません"));
        blogCommentMapper.deleteById(commentId);
        messagingTemplate.convertAndSend(
                RealtimeTopics.blogComments(comment.getBlogId()), CommentEvent.deleted(commentId));
    }

    public List<BlogCommentResponse> listCommentsForTeacher(UUID blogId, UUID teacherId) {
        blogService.requireVisibleForTeacher(blogId, teacherId);
        return blogCommentMapper.findByBlogId(blogId).stream().map(this::toCommentResponse).toList();
    }

    public List<BlogCommentResponse> listCommentsForStudent(UUID blogId) {
        blogService.requireVisibleForStudent(blogId);
        return blogCommentMapper.findByBlogId(blogId).stream().map(this::toCommentResponse).toList();
    }

    public List<BlogCommentResponse> listCommentsForAdmin(UUID blogId) {
        return blogCommentMapper.findByBlogId(blogId).stream().map(this::toCommentResponse).toList();
    }

    public List<BlogImageResponse> listImagesForAdmin(UUID blogId) {
        return blogImageMapper.findByBlogId(blogId).stream().map(this::toImageResponse).toList();
    }

    @Transactional
    public void like(UUID blogId, ActorType likerType, UUID likerId) {
        blogService.findBlogEntity(blogId);
        if (blogLikeMapper.findByBlogIdAndLiker(blogId, likerType, likerId).isPresent()) {
            throw new IllegalArgumentException("既にいいね済みです");
        }
        BlogLike like = new BlogLike();
        like.setId(UUID.randomUUID());
        like.setBlogId(blogId);
        like.setLikerType(likerType);
        like.setLikerId(likerId);
        blogLikeMapper.insert(like);
    }

    @Transactional
    public void unlike(UUID blogId, ActorType likerType, UUID likerId) {
        blogService.findBlogEntity(blogId);
        if (blogLikeMapper.findByBlogIdAndLiker(blogId, likerType, likerId).isEmpty()) {
            throw new IllegalArgumentException("いいね済みではありません");
        }
        blogLikeMapper.deleteByBlogIdAndLiker(blogId, likerType, likerId);
    }

    public ReportLikeStatusResponse getLikeStatus(UUID blogId, ActorType likerType, UUID likerId) {
        boolean liked = blogLikeMapper.findByBlogIdAndLiker(blogId, likerType, likerId).isPresent();
        int count = blogLikeMapper.countByBlogId(blogId);
        return new ReportLikeStatusResponse(liked, count);
    }

    public ReportLikeCountResponse getLikeCount(UUID blogId) {
        return new ReportLikeCountResponse(blogLikeMapper.countByBlogId(blogId));
    }

    private BlogComment requireAuthoredComment(UUID commentId, ActorType authorType, UUID authorId) {
        BlogComment comment =
                blogCommentMapper.findById(commentId).orElseThrow(() -> new IllegalArgumentException("コメントが見つかりません"));
        if (comment.getAuthorType() != authorType || !comment.getAuthorId().equals(authorId)) {
            throw new IllegalArgumentException("権限がありません");
        }
        return comment;
    }

    private BlogImageResponse toImageResponse(BlogImage image) {
        return new BlogImageResponse(image.getId(), image.getImageUrl(), image.getCreatedAt());
    }

    private BlogCommentResponse toCommentResponse(BlogComment comment) {
        String authorName =
                switch (comment.getAuthorType()) {
                    case TEACHER -> teacherMapper
                            .findById(comment.getAuthorId())
                            .map(Teacher::getName)
                            .orElse(null);
                    case STUDENT -> studentMapper
                            .findById(comment.getAuthorId())
                            .map(Student::getName)
                            .orElse(null);
                };
        return new BlogCommentResponse(
                comment.getId(),
                comment.getBlogId(),
                comment.getAuthorType().name(),
                comment.getAuthorId(),
                authorName,
                comment.getContent(),
                comment.getParentCommentId(),
                comment.getCreatedAt(),
                comment.getUpdatedAt());
    }
}
