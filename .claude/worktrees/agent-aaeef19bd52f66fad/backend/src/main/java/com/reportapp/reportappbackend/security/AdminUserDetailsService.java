package com.reportapp.reportappbackend.security;

import com.reportapp.reportappbackend.entity.Admin;
import com.reportapp.reportappbackend.mapper.AdminMapper;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AdminUserDetailsService implements UserDetailsService {

    private final AdminMapper adminMapper;

    public AdminUserDetailsService(AdminMapper adminMapper) {
        this.adminMapper = adminMapper;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Admin admin = adminMapper.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
        return new AppUserPrincipal(
                admin.getId(), admin.getUsername(), admin.getPasswordHash(), admin.getName(), "ADMIN");
    }
}
