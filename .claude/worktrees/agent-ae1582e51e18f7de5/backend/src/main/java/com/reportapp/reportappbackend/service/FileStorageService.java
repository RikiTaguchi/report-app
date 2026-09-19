package com.reportapp.reportappbackend.service;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private static final String URL_PREFIX = "/api/files/";

    private final String uploadDir;

    public FileStorageService(@Value("${app.upload.dir}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    public String saveFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("画像ファイルのみアップロードできます");
        }

        String extension = "";
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
        }
        String filename = UUID.randomUUID() + extension;

        try {
            Path targetDir = Path.of(uploadDir);
            Files.createDirectories(targetDir);
            file.transferTo(targetDir.resolve(filename));
        } catch (IOException e) {
            throw new IllegalStateException("ファイル保存に失敗しました", e);
        }

        return URL_PREFIX + filename;
    }

    public void deleteFile(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith(URL_PREFIX)) {
            return;
        }
        String filename = imageUrl.substring(URL_PREFIX.length());
        try {
            Files.deleteIfExists(Path.of(uploadDir).resolve(filename));
        } catch (IOException e) {
            throw new IllegalStateException("ファイル削除に失敗しました", e);
        }
    }

    public Optional<Resource> loadAsResource(String filename) {
        Path targetDir = Path.of(uploadDir).normalize();
        Path filePath = targetDir.resolve(filename).normalize();
        if (!filePath.startsWith(targetDir) || !Files.isRegularFile(filePath)) {
            return Optional.empty();
        }
        try {
            return Optional.of(new UrlResource(filePath.toUri()));
        } catch (MalformedURLException e) {
            return Optional.empty();
        }
    }
}
