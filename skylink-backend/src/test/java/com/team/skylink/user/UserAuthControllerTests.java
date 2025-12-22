package com.team.skylink.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.skylink.common.Result;
import com.team.skylink.module.user.controller.UserAuthController;
import com.team.skylink.module.user.dto.LoginRequest;
import com.team.skylink.module.user.dto.LoginResponse;
import com.team.skylink.module.user.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class UserAuthControllerTests {
    private MockMvc mvc;
    private AuthService authService;

    @BeforeEach
    void setup() {
        authService = Mockito.mock(AuthService.class);
        mvc = MockMvcBuilders.standaloneSetup(new UserAuthController(authService)).build();
    }

    @Test
    void createSession_success() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setPhoneNumber("13800000000");
        req.setPassword("pwd");
        Mockito.when(authService.login(Mockito.any(LoginRequest.class)))
                .thenReturn(Result.ok(new LoginResponse(1L,"13800000000","user","t")));
        ObjectMapper om = new ObjectMapper();
        mvc.perform(post("/api/v1/users/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void createSession_validation_fail() throws Exception {
        ObjectMapper om = new ObjectMapper();
        mvc.perform(post("/api/v1/users/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(new LoginRequest())))
                .andExpect(status().isBadRequest());
    }
}

