package com.reportapp.reportappbackend.web.dto;

import java.util.UUID;

public record SubjectResponse(UUID id, String name, Integer displayOrder) {
}
