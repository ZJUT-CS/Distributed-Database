package com.team.skylink.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;

@Component
public class IdempotencyFilter extends OncePerRequestFilter {
    private static final String HEADER_IDEMPOTENCY_KEY = "Idempotency-Key";

    private static final Set<String> IDEMPOTENT_PATHS = Set.of(
            "/orders/create",
            "/api/v1/orders/create",
            "/payments/pay",
            "/api/v1/payments/pay",
            "/refund-change/apply",
            "/api/v1/refund-change/apply"
    );

    private final Cache<String, StoredResponse> cache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(10))
            .build();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String method = request.getMethod();
        if (method == null) return true;
        String m = method.toUpperCase();
        if (!m.equals("POST") && !m.equals("PUT") && !m.equals("PATCH")) return true;

        String key = request.getHeader(HEADER_IDEMPOTENCY_KEY);
        if (!StringUtils.hasText(key)) return true;

        String path = request.getRequestURI();
        return path == null || !IDEMPOTENT_PATHS.contains(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String idemKey = request.getHeader(HEADER_IDEMPOTENCY_KEY);
        String cacheKey = buildCacheKey(request, idemKey);

        StoredResponse cached = cache.getIfPresent(cacheKey);
        if (cached != null) {
            response.setStatus(cached.status);
            response.setHeader("X-Idempotency-Replayed", "true");
            if (StringUtils.hasText(cached.contentType)) {
                response.setContentType(cached.contentType);
            } else {
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            }
            response.getOutputStream().write(cached.body);
            return;
        }

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            byte[] body = wrappedResponse.getContentAsByteArray();
            int status = wrappedResponse.getStatus();
            String contentType = wrappedResponse.getContentType();

            if (status >= 200 && status < 300 && body != null && body.length > 0 && body.length <= 1024 * 1024) {
                cache.put(cacheKey, new StoredResponse(status, contentType, body));
            }
            wrappedResponse.copyBodyToResponse();
        }
    }

    private static String buildCacheKey(HttpServletRequest request, String idemKey) {
        String userId = request.getHeader("X-User-Id");
        String path = request.getRequestURI();
        String method = request.getMethod();
        return (method != null ? method : "") + ":" + (path != null ? path : "") + ":" + (userId != null ? userId : "") + ":" + idemKey;
    }

    private record StoredResponse(int status, String contentType, byte[] body) {}
}
