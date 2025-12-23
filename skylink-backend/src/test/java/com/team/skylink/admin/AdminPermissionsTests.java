package com.team.skylink.admin;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.controller.AdminConfigController;
import com.team.skylink.module.admin.controller.AdminController;
import com.team.skylink.module.admin.entity.Admin;
import com.team.skylink.module.admin.service.AdminConfigService;
import com.team.skylink.module.admin.service.AdminManagementService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class AdminPermissionsTests {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    void createAdmin_requires_super_admin() throws Exception {
        AdminManagementService adminManagementService = Mockito.mock(AdminManagementService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new AdminController(adminManagementService)).build();

        String body = "{\"adminAccount\":\"test_admin\",\"password\":\"123456\",\"role\":1}";
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admins")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-Type", "2")
                        .header("X-Admin-Role", "1")
                        .content(body))
                .andReturn();
        Map resp = MAPPER.readValue(result.getResponse().getContentAsString(), Map.class);
        assertEquals(403, ((Number) resp.get("code")).intValue());
    }

    @Test
    void createAdmin_allowed_for_super_admin() throws Exception {
        AdminManagementService adminManagementService = Mockito.mock(AdminManagementService.class);
        Admin admin = new Admin();
        admin.setAdminId(1L);
        admin.setAdminAccount("test_admin");
        Mockito.when(adminManagementService.createAdmin(Mockito.anyString(), Mockito.anyString(), Mockito.any()))
                .thenReturn(Result.ok(admin));

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new AdminController(adminManagementService)).build();
        String unique = "test_admin_" + System.currentTimeMillis();
        String body = "{\"adminAccount\":\"" + unique + "\",\"password\":\"123456\",\"role\":1}";
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admins")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-Type", "2")
                        .header("X-Admin-Role", "2")
                        .content(body))
                .andReturn();
        Map resp = MAPPER.readValue(result.getResponse().getContentAsString(), Map.class);
        assertEquals(0, ((Number) resp.get("code")).intValue());
        assertNotNull(resp.get("data"));
    }

    @Test
    void system_config_mutations_require_super_admin() throws Exception {
        AdminConfigService adminConfigService = Mockito.mock(AdminConfigService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new AdminConfigController(adminConfigService)).build();
        String createBody = "{\"configName\":\"core.switch\",\"configValue\":\"on\"}";
        MvcResult createForbidden = mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/admins/system-configs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-Type", "2")
                        .header("X-Admin-Role", "1")
                        .content(createBody))
                .andReturn();
        Map resp1 = MAPPER.readValue(createForbidden.getResponse().getContentAsString(), Map.class);
        assertEquals(403, ((Number) resp1.get("code")).intValue());

        // 允许情况在其他接口覆盖，此处仅验证禁止逻辑边界
    }
}
