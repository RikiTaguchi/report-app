package com.reportapp.reportappbackend.service;

import com.reportapp.reportappbackend.entity.ActorType;
import com.reportapp.reportappbackend.entity.Blog;
import com.reportapp.reportappbackend.entity.BlogImage;
import com.reportapp.reportappbackend.entity.Teacher;
import com.reportapp.reportappbackend.mapper.BlogCommentMapper;
import com.reportapp.reportappbackend.mapper.BlogImageMapper;
import com.reportapp.reportappbackend.mapper.BlogLikeMapper;
import com.reportapp.reportappbackend.mapper.BlogMapper;
import com.reportapp.reportappbackend.mapper.TeacherMapper;
import com.reportapp.reportappbackend.web.dto.BlogCreateRequest;
import com.reportapp.reportappbackend.web.dto.BlogResponse;
import com.reportapp.reportappbackend.web.dto.BlogUpdateRequest;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BlogService {

    private final BlogMapper blogMapper;
    private final BlogImageMapper blogImageMapper;
    private final BlogCommentMapper blogCommentMapper;
    private final BlogLikeMapper blogLikeMapper;
    private final TeacherMapper teacherMapper;
    private final FileStorageService fileStorageService;

    public BlogService(
            BlogMapper blogMapper,
            BlogImageMapper blogImageMapper,
            BlogCommentMapper blogCommentMapper,
            BlogLikeMapper blogLikeMapper,
            TeacherMapper teacherMapper,
            FileStorageService fileStorageService) {
        this.blogMapper = blogMapper;
        this.blogImageMapper = blogImageMapper;
        this.blogCommentMapper = blogCommentMapper;
        this.blogLikeMapper = blogLikeMapper;
        this.teacherMapper = teacherMapper;
        this.fileStorageService = fileStorageService;
    }

    public List<BlogResponse> listOwn(UUID teacherId) {
        return blogMapper.findByTeacherId(teacherId).stream()
                .map(blog -> toResponse(blog, ActorType.TEACHER, teacherId))
                .toList();
    }

    public List<BlogResponse> listPublished(ActorType actorType, UUID actorId) {
        return blogMapper.findPublished().stream()
                .map(blog -> toResponse(blog, actorType, actorId))
                .toList();
    }

    public List<BlogResponse> listAll() {
        return blogMapper.findAll().stream().map(blog -> toResponse(blog, null, null)).toList();
    }

    public BlogResponse getVisibleForTeacher(UUID blogId, UUID teacherId) {
        return toResponse(requireVisibleForTeacher(blogId, teacherId), ActorType.TEACHER, teacherId);
    }

    public BlogResponse getVisibleForStudent(UUID blogId, UUID studentId) {
        return toResponse(requireVisibleForStudent(blogId), ActorType.STUDENT, studentId);
    }

    public BlogResponse getForAdmin(UUID blogId) {
        return toResponse(findById(blogId), null, null);
    }

    @Transactional
    public BlogResponse create(UUID teacherId, BlogCreateRequest request) {
        Blog blog = new Blog();
        blog.setId(UUID.randomUUID());
        blog.setTeacherId(teacherId);
        blog.setTitle(request.title());
        blog.setContent(request.content());
        blog.setPublishedAt(null);
        blogMapper.insert(blog);
        return toResponse(findById(blog.getId()), ActorType.TEACHER, teacherId);
    }

    @Transactional
    public BlogResponse update(UUID blogId, UUID teacherId, BlogUpdateRequest request) {
        Blog blog = requireOwned(blogId, teacherId);
        blog.setTitle(request.title());
        blog.setContent(request.content());
        blogMapper.update(blog);
        return toResponse(findById(blogId), ActorType.TEACHER, teacherId);
    }

    @Transactional
    public BlogResponse publish(UUID blogId, UUID teacherId) {
        Blog blog = requireOwned(blogId, teacherId);
        if (blog.getPublishedAt() != null) {
            throw new IllegalArgumentException("既に公開済みです");
        }
        blog.setPublishedAt(LocalDateTime.now(ZoneId.of("Asia/Tokyo")));
        blogMapper.update(blog);
        return toResponse(findById(blogId), ActorType.TEACHER, teacherId);
    }

    @Transactional
    public void delete(UUID blogId, UUID actingTeacherId) {
        Blog blog = findById(blogId);
        if (actingTeacherId != null && !blog.getTeacherId().equals(actingTeacherId)) {
            throw new IllegalArgumentException("権限がありません");
        }

        List<BlogImage> images = blogImageMapper.findByBlogId(blogId);
        for (BlogImage image : images) {
            fileStorageService.deleteFile(image.getImageUrl());
        }
        blogLikeMapper.deleteByBlogId(blogId);
        blogCommentMapper.deleteByBlogId(blogId);
        blogImageMapper.deleteByBlogId(blogId);
        blogMapper.deleteById(blogId);
    }

    Blog requireOwned(UUID blogId, UUID teacherId) {
        Blog blog = findById(blogId);
        if (!blog.getTeacherId().equals(teacherId)) {
            throw new IllegalArgumentException("権限がありません");
        }
        return blog;
    }

    Blog requireVisibleForTeacher(UUID blogId, UUID teacherId) {
        Blog blog = findById(blogId);
        boolean isOwner = blog.getTeacherId().equals(teacherId);
        if (!isOwner && blog.getPublishedAt() == null) {
            throw new IllegalArgumentException("ブログが見つかりません");
        }
        return blog;
    }

    Blog requireVisibleForStudent(UUID blogId) {
        Blog blog = findById(blogId);
        if (blog.getPublishedAt() == null) {
            throw new IllegalArgumentException("ブログが見つかりません");
        }
        return blog;
    }

    Blog findBlogEntity(UUID blogId) {
        return findById(blogId);
    }

    public boolean isVisibleTo(UUID blogId, String role, UUID actorId) {
        return blogMapper
                .findById(blogId)
                .map(blog -> switch (role) {
                    case "ADMIN" -> true;
                    case "TEACHER" -> blog.getTeacherId().equals(actorId) || blog.getPublishedAt() != null;
                    case "STUDENT" -> blog.getPublishedAt() != null;
                    default -> false;
                })
                .orElse(false);
    }

    private Blog findById(UUID blogId) {
        return blogMapper.findById(blogId).orElseThrow(() -> new IllegalArgumentException("ブログが見つかりません"));
    }

    private BlogResponse toResponse(Blog blog, ActorType actorType, UUID actorId) {
        String teacherName = teacherMapper
                .findById(blog.getTeacherId())
                .map(Teacher::getName)
                .orElse(null);
        int likeCount = blogLikeMapper.countByBlogId(blog.getId());
        int commentCount = blogCommentMapper.countByBlogId(blog.getId());
        boolean likedByMe = actorType != null
                && blogLikeMapper.findByBlogIdAndLiker(blog.getId(), actorType, actorId).isPresent();
        return new BlogResponse(
                blog.getId(),
                blog.getTeacherId(),
                teacherName,
                blog.getTitle(),
                blog.getContent(),
                blog.getPublishedAt(),
                blog.getCreatedAt(),
                blog.getUpdatedAt(),
                likeCount,
                commentCount,
                likedByMe);
    }
}
