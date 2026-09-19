package com.reportapp.reportappbackend.websocket;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class RealtimeTopics {

    public static final String REPORT_SUBMISSIONS = "/topic/report-submissions";

    private static final Pattern REPORT_COMMENTS_PATTERN =
            Pattern.compile("^/topic/reports/([^/]+)/([^/]+)/comments$");
    private static final Pattern BLOG_COMMENTS_PATTERN = Pattern.compile("^/topic/blogs/([^/]+)/comments$");

    private RealtimeTopics() {
    }

    public static String reportComments(UUID studentId, LocalDate reportDate) {
        return "/topic/reports/" + studentId + "/" + reportDate + "/comments";
    }

    public static String blogComments(UUID blogId) {
        return "/topic/blogs/" + blogId + "/comments";
    }

    public static boolean isBlogCommentsTopic(String destination) {
        return BLOG_COMMENTS_PATTERN.matcher(destination).matches();
    }

    public static Optional<UUID> parseReportCommentsStudentId(String destination) {
        Matcher matcher = REPORT_COMMENTS_PATTERN.matcher(destination);
        if (!matcher.matches()) {
            return Optional.empty();
        }
        try {
            return Optional.of(UUID.fromString(matcher.group(1)));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
