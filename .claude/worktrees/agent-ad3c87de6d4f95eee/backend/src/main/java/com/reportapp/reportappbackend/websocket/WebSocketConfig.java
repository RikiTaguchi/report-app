package com.reportapp.reportappbackend.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final PrincipalHandshakeHandler principalHandshakeHandler;
    private final TopicSubscriptionInterceptor topicSubscriptionInterceptor;

    public WebSocketConfig(
            PrincipalHandshakeHandler principalHandshakeHandler,
            TopicSubscriptionInterceptor topicSubscriptionInterceptor) {
        this.principalHandshakeHandler = principalHandshakeHandler;
        this.topicSubscriptionInterceptor = topicSubscriptionInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setHandshakeHandler(principalHandshakeHandler)
                .setAllowedOrigins("http://localhost:3000");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(topicSubscriptionInterceptor);
    }
}
