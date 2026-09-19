package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record StudentUpdateRequest(
        @NotBlank String lastName, @NotBlank String firstName, @NotNull UUID teacherId) {
}
