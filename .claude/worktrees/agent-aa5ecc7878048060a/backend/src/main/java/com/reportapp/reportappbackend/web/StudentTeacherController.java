package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.service.TeacherAccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/teachers")
public class StudentTeacherController {

    private final TeacherAccountService teacherAccountService;

    public StudentTeacherController(TeacherAccountService teacherAccountService) {
        this.teacherAccountService = teacherAccountService;
    }

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(teacherAccountService.list());
    }
}
