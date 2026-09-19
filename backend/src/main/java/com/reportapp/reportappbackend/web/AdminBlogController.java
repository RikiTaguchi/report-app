package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.service.BlogService;
import com.reportapp.reportappbackend.service.BlogSocialService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/blogs")
public class AdminBlogController {

    private final BlogService blogService;
    private final BlogSocialService blogSocialService;

    public AdminBlogController(BlogService blogService, BlogSocialService blogSocialService) {
        this.blogService = blogService;
        this.blogSocialService = blogSocialService;
    }

    @GetMapping
    public ResponseEntity<?> listAll() {
        return ResponseEntity.ok(blogService.listAll());
    }

    @GetMapping("/{blogId}")
    public ResponseEntity<?> get(@PathVariable UUID blogId) {
        try {
            return ResponseEntity.ok(blogService.getForAdmin(blogId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{blogId}/comments")
    public ResponseEntity<?> listComments(@PathVariable UUID blogId) {
        return ResponseEntity.ok(blogSocialService.listCommentsForAdmin(blogId));
    }

    @GetMapping("/{blogId}/images")
    public ResponseEntity<?> listImages(@PathVariable UUID blogId) {
        return ResponseEntity.ok(blogSocialService.listImagesForAdmin(blogId));
    }

    @DeleteMapping("/{blogId}")
    public ResponseEntity<?> delete(@PathVariable UUID blogId) {
        try {
            blogService.delete(blogId, null);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{blogId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable UUID blogId, @PathVariable UUID commentId) {
        try {
            blogSocialService.deleteCommentAsAdmin(commentId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
