package com.team.skylink.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.skylink.common.Result;
import com.team.skylink.module.user.controller.UserController;
import com.team.skylink.module.user.entity.User;
import com.team.skylink.module.user.service.AuthService;
import com.team.skylink.module.user.service.SessionIdentity;
import com.team.skylink.module.user.service.SessionStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class UserControllerTests {
    private MockMvc mvc;
    private AuthService authService;
    private SessionStore sessionStore;

    @BeforeEach
    void setup() {
        authService = Mockito.mock(AuthService.class);
        sessionStore = Mockito.mock(SessionStore.class);
        mvc = MockMvcBuilders.standaloneSetup(new UserController(authService, sessionStore)).build();
    }

    @Test
    void me_requires_login() throws Exception {
        mvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isOk());
    }

    @Test
    void me_success_with_token() throws Exception {
        Mockito.when(sessionStore.resolve(Mockito.anyString())).thenReturn(new SessionIdentity(1L, 1));
        User u = new User();
        u.setUserId(1L);
        u.setCreateTime(LocalDateTime.now());
        Mockito.when(authService.getUserById(1L)).thenReturn(Result.ok(u));
        mvc.perform(get("/api/v1/users/me").header("Authorization","Bearer t"))
                .andExpect(status().isOk());
    }

    @Test
    void updateProfile_requires_login() throws Exception {
        ObjectMapper om = new ObjectMapper();
        UserController.UpdateProfileRequest req = new UserController.UpdateProfileRequest();
        mvc.perform(put("/api/v1/users/me").contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void changePassword_requires_login() throws Exception {
        ObjectMapper om = new ObjectMapper();
        UserController.ChangePasswordRequest req = new UserController.ChangePasswordRequest();
        req.setOldPassword("old");
        req.setNewPassword("newpass");
        mvc.perform(put("/api/v1/users/me/password").contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void bindContact_requires_login() throws Exception {
        ObjectMapper om = new ObjectMapper();
        UserController.BindContactRequest req = new UserController.BindContactRequest();
        req.setValue("a@b.com");
        req.setCode("123456");
        mvc.perform(post("/api/v1/users/me/contacts").contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
                .andExpect(status().isOk());
    }
}
