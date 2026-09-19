package com.reportapp.reportappbackend.security;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class AppUserPrincipal implements UserDetails {

    private final UUID id;
    private final String username;
    private final String password;
    private final String name;
    private final String role;
    private final String profileImageUrl;

    public AppUserPrincipal(UUID id, String username, String password, String name, String role) {
        this(id, username, password, name, role, null);
    }

    public AppUserPrincipal(
            UUID id, String username, String password, String name, String role, String profileImageUrl) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.name = name;
        this.role = role;
        this.profileImageUrl = profileImageUrl;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }
}
