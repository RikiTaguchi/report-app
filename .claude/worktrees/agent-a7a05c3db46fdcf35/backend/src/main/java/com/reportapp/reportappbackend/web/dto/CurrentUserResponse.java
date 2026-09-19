package com.reportapp.reportappbackend.web.dto;

import java.util.UUID;

public record CurrentUserResponse(UUID id, String username, String name, String role, String profileImageUrl) {
}
