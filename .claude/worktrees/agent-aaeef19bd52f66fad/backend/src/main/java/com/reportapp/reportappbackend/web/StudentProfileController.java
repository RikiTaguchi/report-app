package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.service.StudentAccountService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/student/profile/image")
public class StudentProfileController {

    private final StudentAccountService studentAccountService;

    public StudentProfileController(StudentAccountService studentAccountService) {
        this.studentAccountService = studentAccountService;
    }

    @PostMapping
    public ResponseEntity<?> uploadImage(
            @AuthenticationPrincipal AppUserPrincipal principal, @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(studentAccountService.updateProfileImage(principal.getId(), file));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ファイル保存に失敗しました"));
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteImage(@AuthenticationPrincipal AppUserPrincipal principal) {
        try {
            return ResponseEntity.ok(studentAccountService.deleteProfileImage(principal.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
