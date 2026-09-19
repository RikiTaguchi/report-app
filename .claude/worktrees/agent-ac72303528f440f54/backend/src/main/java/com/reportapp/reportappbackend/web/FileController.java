package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.entity.BlogImage;
import com.reportapp.reportappbackend.entity.ReportImage;
import com.reportapp.reportappbackend.entity.Student;
import com.reportapp.reportappbackend.mapper.BlogImageMapper;
import com.reportapp.reportappbackend.mapper.ReportImageMapper;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.service.BlogService;
import com.reportapp.reportappbackend.service.DailyReportService;
import com.reportapp.reportappbackend.service.FileStorageService;
import java.util.Optional;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final ReportImageMapper reportImageMapper;
    private final BlogImageMapper blogImageMapper;
    private final StudentMapper studentMapper;
    private final DailyReportService dailyReportService;
    private final BlogService blogService;
    private final FileStorageService fileStorageService;

    public FileController(
            ReportImageMapper reportImageMapper,
            BlogImageMapper blogImageMapper,
            StudentMapper studentMapper,
            DailyReportService dailyReportService,
            BlogService blogService,
            FileStorageService fileStorageService) {
        this.reportImageMapper = reportImageMapper;
        this.blogImageMapper = blogImageMapper;
        this.studentMapper = studentMapper;
        this.dailyReportService = dailyReportService;
        this.blogService = blogService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> get(
            @AuthenticationPrincipal AppUserPrincipal principal, @PathVariable String filename) {
        String imageUrl = "/api/files/" + filename;

        Optional<ReportImage> reportImage = reportImageMapper.findByImageUrl(imageUrl);
        if (reportImage.isPresent()) {
            if (!dailyReportService.isReportVisibleTo(
                    reportImage.get().getDailyReportId(), principal.getRole(), principal.getId())) {
                return ResponseEntity.status(403).build();
            }
            return serve(filename);
        }

        Optional<BlogImage> blogImage = blogImageMapper.findByImageUrl(imageUrl);
        if (blogImage.isPresent()) {
            if (!blogService.isVisibleTo(blogImage.get().getBlogId(), principal.getRole(), principal.getId())) {
                return ResponseEntity.status(403).build();
            }
            return serve(filename);
        }

        Optional<Student> profileOwner = studentMapper.findByProfileImageUrl(imageUrl);
        if (profileOwner.isPresent()) {
            if (!isProfileImageVisibleTo(profileOwner.get(), principal)) {
                return ResponseEntity.status(403).build();
            }
            return serve(filename);
        }

        return ResponseEntity.notFound().build();
    }

    private boolean isProfileImageVisibleTo(Student student, AppUserPrincipal principal) {
        return switch (principal.getRole()) {
            case "ADMIN" -> true;
            case "STUDENT" -> student.getId().equals(principal.getId());
            case "TEACHER" -> student.getTeacherId().equals(principal.getId());
            default -> false;
        };
    }

    private ResponseEntity<Resource> serve(String filename) {
        return fileStorageService
                .loadAsResource(filename)
                .map(resource -> ResponseEntity.ok()
                        .contentType(MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM))
                        .body(resource))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
