package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.entity.ActorType;
import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.service.BlogService;
import com.reportapp.reportappbackend.service.BlogSocialService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/blogs")
public class StudentBlogController {

    private final BlogService blogService;
    private final BlogSocialService blogSocialService;

    public StudentBlogController(BlogService blogService, BlogSocialService blogSocialService) {
        this.blogService = blogService;
        this.blogSocialService = blogSocialService;
    }

    @GetMapping
    public ResponseEntity<?> listPublished(@AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.ok(blogService.listPublished(ActorType.STUDENT, principal.getId()));
    }

    @GetMapping("/{blogId}")
    public ResponseEntity<?> get(@AuthenticationPrincipal AppUserPrincipal principal, @PathVariable UUID blogId) {
        try {
            return ResponseEntity.ok(blogService.getVisibleForStudent(blogId, principal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{blogId}/images")
    public ResponseEntity<?> listImages(@PathVariable UUID blogId) {
        try {
            return ResponseEntity.ok(blogSocialService.listImagesForStudent(blogId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{blogId}/comments")
    public ResponseEntity<?> listComments(@PathVariable UUID blogId) {
        try {
            return ResponseEntity.ok(blogSocialService.listCommentsForStudent(blogId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{blogId}/likes")
    public ResponseEntity<?> getLikeStatus(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable UUID blogId) {
        return ResponseEntity.ok(blogSocialService.getLikeStatus(blogId, ActorType.STUDENT, principal.getId()));
    }

    @PostMapping("/{blogId}/likes")
    public ResponseEntity<?> like(@AuthenticationPrincipal AppUserPrincipal principal, @PathVariable UUID blogId) {
        try {
            blogSocialService.like(blogId, ActorType.STUDENT, principal.getId());
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{blogId}/likes")
    public ResponseEntity<?> unlike(@AuthenticationPrincipal AppUserPrincipal principal, @PathVariable UUID blogId) {
        try {
            blogSocialService.unlike(blogId, ActorType.STUDENT, principal.getId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
