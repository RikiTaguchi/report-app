package com.reportapp.reportappbackend.web;

import com.reportapp.reportappbackend.security.AppUserPrincipal;
import com.reportapp.reportappbackend.web.dto.CurrentUserResponse;
import com.reportapp.reportappbackend.web.dto.ErrorResponse;
import com.reportapp.reportappbackend.web.dto.LoginRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager adminAuthenticationManager;
    private final AuthenticationManager teacherAuthenticationManager;
    private final AuthenticationManager studentAuthenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public AuthController(
            @Qualifier("adminAuthenticationManager") AuthenticationManager adminAuthenticationManager,
            @Qualifier("teacherAuthenticationManager") AuthenticationManager teacherAuthenticationManager,
            @Qualifier("studentAuthenticationManager") AuthenticationManager studentAuthenticationManager,
            SecurityContextRepository securityContextRepository) {
        this.adminAuthenticationManager = adminAuthenticationManager;
        this.teacherAuthenticationManager = teacherAuthenticationManager;
        this.studentAuthenticationManager = studentAuthenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf(CsrfToken csrfToken) {
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/admin/login")
    public ResponseEntity<?> adminLogin(
            @RequestBody @Valid LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        return login(adminAuthenticationManager, "ADMIN", request, httpRequest, httpResponse);
    }

    @PostMapping("/teacher/login")
    public ResponseEntity<?> teacherLogin(
            @RequestBody @Valid LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        return login(teacherAuthenticationManager, "TEACHER", request, httpRequest, httpResponse);
    }

    @PostMapping("/student/login")
    public ResponseEntity<?> studentLogin(
            @RequestBody @Valid LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        return login(studentAuthenticationManager, "STUDENT", request, httpRequest, httpResponse);
    }

    private ResponseEntity<?> login(
            AuthenticationManager authenticationManager,
            String role,
            LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        try {
            UsernamePasswordAuthenticationToken authRequest =
                    UsernamePasswordAuthenticationToken.unauthenticated(request.username(), request.password());
            Authentication authentication = authenticationManager.authenticate(authRequest);

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, httpRequest, httpResponse);

            AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
            return ResponseEntity.ok(toResponse(principal));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("ユーザー名またはパスワードが正しくありません"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("ログインしていません"));
        }
        return ResponseEntity.ok(toResponse(principal));
    }

    private CurrentUserResponse toResponse(AppUserPrincipal principal) {
        return new CurrentUserResponse(
                principal.getId(),
                principal.getUsername(),
                principal.getName(),
                principal.getRole(),
                principal.getProfileImageUrl());
    }
}
