package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record StudentCreateRequest(
        @NotBlank String username,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank String lastName,
        @NotBlank String firstName,
        @NotNull UUID teacherId) {
}
