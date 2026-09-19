package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.service.TeacherAccountService;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teacher/teachers")
public class TeacherDirectoryController {

    private final TeacherAccountService teacherAccountService;

    public TeacherDirectoryController(TeacherAccountService teacherAccountService) {
        this.teacherAccountService = teacherAccountService;
    }

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(teacherAccountService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(teacherAccountService.get(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
}
