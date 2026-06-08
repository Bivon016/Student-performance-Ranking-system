package com.gradingSystem.GraadingSystem.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_BYTES = 2 * 1024 * 1024;

    private final Path uploadRoot;

    public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public String storeSchoolLogo(Long schoolId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Logo file is required");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Logo must be under 2 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Only PNG, JPG, WEBP or GIF images are allowed");
        }

        String ext = extensionFor(contentType, file.getOriginalFilename());
        String filename = "school-" + schoolId + "-" + UUID.randomUUID() + ext;

        try {
            Path logosDir = uploadRoot.resolve("logos");
            Files.createDirectories(logosDir);
            Path target = logosDir.resolve(filename);
            Files.copy(file.getInputStream(), target);
            return "/uploads/logos/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store logo file", e);
        }
    }

    public void deleteStoredFile(String publicPath) {
        if (publicPath == null || publicPath.isBlank()) return;
        if (!publicPath.startsWith("/uploads/")) return;

        try {
            Path relative = Paths.get(publicPath.replaceFirst("^/uploads/", ""));
            Path file = uploadRoot.resolve(relative).normalize();
            if (!file.startsWith(uploadRoot)) return;
            Files.deleteIfExists(file);
        } catch (IOException ignored) {
            // Best-effort cleanup
        }
    }

    public boolean isStoredPath(String value) {
        return value != null && value.startsWith("/uploads/");
    }

    private String extensionFor(String contentType, String originalName) {
        return switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> {
                if (originalName != null && originalName.contains(".")) {
                    String ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
                    if (ext.matches("\\.(jpg|jpeg|png|webp|gif)")) {
                        yield ext;
                    }
                }
                yield ".jpg";
            }
        };
    }
}
