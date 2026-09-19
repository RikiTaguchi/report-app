package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.entity.ActorType;
import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.service.BlogService;
import com.reportapp.reportappbackend.service.BlogSocialService;
import com.reportapp.reportappbackend.web.dto.BlogCommentRequest;
import com.reportapp.reportappbackend.web.dto.BlogCreateRequest;
import com.reportapp.reportappbackend.web.dto.BlogUpdateRequest;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/teacher/blogs")
public class TeacherBlogController {

    private final BlogService blogService;
    private final BlogSocialService blogSocialService;

    public TeacherBlogController(BlogService blogService, BlogSocialService blogSocialService) {
        this.blogService = blogService;
        this.blogSocialService = blogSocialService;
    }

    @GetMapping
    public ResponseEntity<?> listOwn(@AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.ok(blogService.listOwn(principal.getId()));
    }

    @GetMapping("/published")
    public ResponseEntity<?> listPublished(@AuthenticationPrincipal AppUserPrincipal principal) {
        return ResponseEntity.ok(blogService.listAll(ActorType.TEACHER, principal.getId()));
    }

    @GetMapping("/{blogId}")
    public ResponseEntity<?> get(@AuthenticationPrincipal AppUserPrincipal principal, @PathVariable UUID blogId) {
        try {
            return ResponseEntity.ok(blogService.getVisibleForTeacher(blogId, principal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(
            @AuthenticationPrincipal AppUserPrincipal principal, @RequestBody @Valid BlogCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(blogService.create(principal.getId(), request));
    }

    @PutMapping("/{blogId}")
    public ResponseEntity<?> update(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID blogId,
            @RequestBody @Valid BlogUpdateRequest request) {
        try {
            return ResponseEntity.ok(blogService.update(blogId, principal.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{blogId}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal AppUserPrincipal principal, @PathVariable UUID blogId) {
        try {
            blogService.delete(blogId, principal.getId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{blogId}/images")
    public ResponseEntity<?> listImages(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable UUID blogId) {
        try {
            return ResponseEntity.ok(blogSocialService.listImagesForTeacher(blogId, principal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/{blogId}/images")
    public ResponseEntity<?> uploadImage(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID blogId,
            @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(blogSocialService.uploadImage(blogId, principal.getId(), file));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ファイル保存に失敗しました"));
        }
    }

    @DeleteMapping("/{blogId}/images/{imageId}")
    public ResponseEntity<?> deleteImage(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID blogId,
            @PathVariable UUID imageId) {
        try {
            blogSocialService.deleteImage(imageId, blogId, principal.getId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{blogId}/comments")
    public ResponseEntity<?> listComments(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable UUID blogId) {
        try {
            return ResponseEntity.ok(blogSocialService.listCommentsForTeacher(blogId, principal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/{blogId}/comments")
    public ResponseEntity<?> createComment(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID blogId,
            @RequestBody @Valid BlogCommentRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(blogSocialService.createCommentAsTeacher(blogId, principal.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{blogId}/comments/{commentId}")
    public ResponseEntity<?> updateComment(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID blogId,
            @PathVariable UUID commentId,
            @RequestBody @Valid BlogCommentRequest request) {
        try {
            return ResponseEntity.ok(blogSocialService.updateCommentAsAuthor(
                    commentId, ActorType.TEACHER, principal.getId(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{blogId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable UUID blogId,
            @PathVariable UUID commentId) {
        try {
            blogSocialService.deleteCommentAsAuthor(commentId, ActorType.TEACHER, principal.getId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{blogId}/likes")
    public ResponseEntity<?> getLikeStatus(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable UUID blogId) {
        return ResponseEntity.ok(blogSocialService.getLikeStatus(blogId, ActorType.TEACHER, principal.getId()));
    }

    @PostMapping("/{blogId}/likes")
    public ResponseEntity<?> like(@AuthenticationPrincipal AppUserPrincipal principal, @PathVariable UUID blogId) {
        try {
            blogSocialService.like(blogId, ActorType.TEACHER, principal.getId());
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{blogId}/likes")
    public ResponseEntity<?> unlike(@AuthenticationPrincipal AppUserPrincipal principal, @PathVariable UUID blogId) {
        try {
            blogSocialService.unlike(blogId, ActorType.TEACHER, principal.getId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
