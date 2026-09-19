package com.reportapp.reportappbackend.security;

import com.reportapp.reportappbackend.entity.Student;
import com.reportapp.reportappbackend.mapper.StudentMapper;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class StudentUserDetailsService implements UserDetailsService {

    private final StudentMapper studentMapper;

    public StudentUserDetailsService(StudentMapper studentMapper) {
        this.studentMapper = studentMapper;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Student student = studentMapper.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
        return new AppUserPrincipal(
                student.getId(),
                student.getUsername(),
                student.getPasswordHash(),
                student.getName(),
                "STUDENT",
                student.getProfileImageUrl());
    }
}
