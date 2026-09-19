package com.reportapp.reportappbackend.security;

import com.reportapp.reportappbackend.entity.Teacher;
import com.reportapp.reportappbackend.mapper.TeacherMapper;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class TeacherUserDetailsService implements UserDetailsService {

    private final TeacherMapper teacherMapper;

    public TeacherUserDetailsService(TeacherMapper teacherMapper) {
        this.teacherMapper = teacherMapper;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Teacher teacher = teacherMapper.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
        return new AppUserPrincipal(
                teacher.getId(), teacher.getUsername(), teacher.getPasswordHash(), teacher.getName(), "TEACHER");
    }
}
