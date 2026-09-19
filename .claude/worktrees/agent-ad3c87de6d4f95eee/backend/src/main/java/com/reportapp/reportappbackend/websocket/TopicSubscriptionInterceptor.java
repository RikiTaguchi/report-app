package com.reportapp.reportappbackend.websocket;

import com.reportapp.reportappbackend.security.AppUserPrincipal;
import java.security.Principal;
import java.util.Optional;
import java.util.UUID;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class TopicSubscriptionInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() != StompCommand.SUBSCRIBE) {
            return message;
        }

        String destination = accessor.getDestination();
        AppUserPrincipal principal = resolvePrincipal(accessor.getUser());
        if (destination == null || principal == null || !isAuthorized(destination, principal)) {
            throw new AccessDeniedException("権限がありません");
        }
        return message;
    }

    private AppUserPrincipal resolvePrincipal(Principal user) {
        if (user instanceof Authentication authentication
                && authentication.getPrincipal() instanceof AppUserPrincipal appUser) {
            return appUser;
        }
        return null;
    }

    private boolean isAuthorized(String destination, AppUserPrincipal principal) {
        String role = principal.getRole();

        Optional<UUID> reportStudentId = RealtimeTopics.parseReportCommentsStudentId(destination);
        if (reportStudentId.isPresent()) {
            if ("TEACHER".equals(role) || "ADMIN".equals(role)) {
                return true;
            }
            return "STUDENT".equals(role) && reportStudentId.get().equals(principal.getId());
        }

        if (RealtimeTopics.isBlogCommentsTopic(destination)) {
            return "TEACHER".equals(role) || "STUDENT".equals(role) || "ADMIN".equals(role);
        }

        if (RealtimeTopics.REPORT_SUBMISSIONS.equals(destination)) {
            return "TEACHER".equals(role) || "ADMIN".equals(role);
        }

        return false;
    }
}
