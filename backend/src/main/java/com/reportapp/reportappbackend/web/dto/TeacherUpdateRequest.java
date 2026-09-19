package com.reportapp.reportappbackend.web.dto;

import jakarta.validation.constraints.NotBlank;

public record TeacherUpdateRequest(@NotBlank String lastName, @NotBlank String firstName) {
}
