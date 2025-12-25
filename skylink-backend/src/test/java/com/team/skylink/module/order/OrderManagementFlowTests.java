package com.team.skylink.module.order;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.skylink.SkyLinkApplication;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = SkyLinkApplication.class)
@ActiveProfiles("test")
public class OrderManagementFlowTests {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext wac;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private OrderMapper orderMapper;

    @BeforeEach
    void cleanOrders() {
        mockMvc = MockMvcBuilders.webAppContextSetup(this.wac).build();
        jdbcTemplate.execute("DELETE FROM orders");
        jdbcTemplate.execute("UPDATE seat SET status=1, order_id=NULL, passenger_index=NULL");
    }

    @Test
    void createOrder_valid_persists_pendingAudit() throws Exception {
        String body = """
                {
                  "userId": 5000,
                                                                        "flightId": 2000,
                  "cabinType": "ECONOMY",
                  "ticketNum": 2,
                  "passengerName": "Alice",
                  "contactEmail": "alice@example.com",
                  "contactPhone": "13800000000",
                  "passengersJson": "[{\\"name\\":\\"Alice\\"}]"
                }
                """;

        String resp = mockMvc.perform(post("/api/v1/orders")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "1")
                        .content(body))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(resp);
        assertEquals(0, json.get("code").asInt());
        String parentOrderNo = json.get("data").get("orderNo").asText();
        assertNotNull(parentOrderNo);

        List<Orders> rows = orderMapper.selectList(Wrappers.<Orders>lambdaQuery()
                .eq(Orders::getParentOrderId, Long.parseLong(parentOrderNo)));
        assertEquals(2, rows.size());
        assertEquals(0, rows.get(0).getOrderStatus());
        assertEquals(5000L, rows.get(0).getUserId());
        assertNotNull(rows.get(0).getOrderTime());
    }

    @Test
    void createOrder_validationError_returns400() throws Exception {
        String body = """
                {
                  "userId": 5000,
                  "cabinType": "ECONOMY",
                  "ticketNum": 1,
                  "passengerName": "Alice"
                }
                """;

        String resp = mockMvc.perform(post("/api/v1/orders")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "1")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(resp);
        assertEquals(400, json.get("code").asInt());
    }

    @Test
    void createOrder_flightNotFound_returns404() throws Exception {
        String body = """
                {
                  "userId": 5000,
                                                                        "flightId": 999999,
                  "cabinType": "ECONOMY",
                  "ticketNum": 1,
                  "passengerName": "Alice"
                }
                """;

        String resp = mockMvc.perform(post("/api/v1/orders")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "1")
                        .content(body))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(resp);
        assertEquals(404, json.get("code").asInt());
    }

    @Test
    void createOrder_insufficientSeats_returns409() throws Exception {
        String body = """
                {
                  "userId": 5000,
                                                                        "flightId": 2000,
                  "cabinType": "ECONOMY",
                  "ticketNum": 6,
                  "passengerName": "Alice"
                }
                """;

        String resp = mockMvc.perform(post("/api/v1/orders")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "1")
                        .content(body))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(resp);
        assertEquals(409, json.get("code").asInt());
    }

    @Test
    void adminList_requiresAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/admins/orders")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminAudit_pass_updatesStatus_toPendingPayment() throws Exception {
        long orderId = createSingleOrderAndGetOrderId();

        String auditBody = "{\"pass\": true}";
        String resp = mockMvc.perform(post("/api/v1/admins/orders/" + orderId + "/audits")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "2")
                        .content(auditBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(resp);
        assertEquals(0, json.get("code").asInt());

        Orders refreshed = orderMapper.selectById(orderId);
        assertNotNull(refreshed);
        assertEquals(1, refreshed.getOrderStatus());
    }

    @Test
    void adminUpdateStatus_updatesOrderStatusField() throws Exception {
        long orderId = createSingleOrderAndGetOrderId();

        mockMvc.perform(put("/api/v1/admins/orders/" + orderId + "/status")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "2")
                        .content("{\"orderStatus\": 3}"))
                .andExpect(status().isOk());

        Orders refreshed = orderMapper.selectById(orderId);
        assertNotNull(refreshed);
        assertEquals(3, refreshed.getOrderStatus());
    }

    @Test
    void adminCancel_updatesOrderStatus_toCancelled() throws Exception {
        long orderId = createSingleOrderAndGetOrderId();

        mockMvc.perform(put("/api/v1/admins/orders/" + orderId + "/cancellation")
                        .header("X-User-Type", "2"))
                .andExpect(status().isOk());

        Orders refreshed = orderMapper.selectById(orderId);
        assertNotNull(refreshed);
        assertEquals(6, refreshed.getOrderStatus());
    }

    @Test
    void adminDelete_inactiveOrder_deletesRow() throws Exception {
        long orderId = createSingleOrderAndGetOrderId();

        mockMvc.perform(put("/api/v1/admins/orders/" + orderId + "/status")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "2")
                        .content("{\"orderStatus\": 3}"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/admins/orders/" + orderId)
                        .header("X-User-Type", "2"))
                .andExpect(status().isOk());

        assertEquals(null, orderMapper.selectById(orderId));
    }

    @Test
    void adminList_filterByUnknownFlightNo_returnsEmpty() throws Exception {
        String listResp = mockMvc.perform(get("/api/v1/admins/orders")
                        .param("page", "1")
                        .param("size", "10")
                        .param("flightNo", "NOPE")
                        .header("X-User-Type", "2"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode listJson = objectMapper.readTree(listResp);
        assertEquals(0, listJson.get("code").asInt());
        assertEquals(0, listJson.get("data").get("total").asLong());
    }

    @Test
    void adminAudit_nonPendingOrder_returns400() throws Exception {
        long orderId = createSingleOrderAndGetOrderId();

        mockMvc.perform(post("/api/v1/admins/orders/" + orderId + "/audits")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "2")
                        .content("{\"pass\": true}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/admins/orders/" + orderId + "/audits")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "2")
                        .content("{\"pass\": true}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void orderControllerAudit_requiresAdmin_and_updatesStatus() throws Exception {
        long orderId = createSingleOrderAndGetOrderId();

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/audit")
                        .param("approved", "true")
                        .header("X-User-Type", "1"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/audit")
                        .param("approved", "true")
                        .header("X-User-Type", "2"))
                .andExpect(status().isOk());

        Orders refreshed = orderMapper.selectById(orderId);
        assertNotNull(refreshed);
        assertEquals(1, refreshed.getOrderStatus());
    }

    @Test
    void endToEnd_userCreate_adminList_adminAudit() throws Exception {
        long orderId = createSingleOrderAndGetOrderId();

        String listResp = mockMvc.perform(get("/api/v1/admins/orders")
                        .param("page", "1")
                        .param("size", "10")
                        .header("X-User-Type", "2"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode listJson = objectMapper.readTree(listResp);
        assertEquals(0, listJson.get("code").asInt());
        assertTrue(listJson.get("data").get("total").asLong() >= 1);

        String auditBody = "{\"pass\": true}";
        mockMvc.perform(post("/api/v1/admins/orders/" + orderId + "/audits")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "2")
                        .content(auditBody))
                .andExpect(status().isOk());

        Orders refreshed = orderMapper.selectById(orderId);
        assertNotNull(refreshed);
        assertEquals(1, refreshed.getOrderStatus());
    }

    @Test
    void permission_adminCannotCreateOrder() throws Exception {
        String body = """
                {
                  "userId": 5000,
                                                                        "flightId": 2000,
                  "cabinType": "ECONOMY",
                  "ticketNum": 1,
                  "passengerName": "Alice"
                }
                """;

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "2")
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    void permission_userCannotAudit() throws Exception {
        long orderId = createSingleOrderAndGetOrderId();

        mockMvc.perform(post("/api/v1/admins/orders/" + orderId + "/audits")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "1")
                        .content("{\"pass\": true}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/audit")
                        .param("approved", "true")
                        .header("X-User-Type", "1"))
                .andExpect(status().isForbidden());
    }

    private long createSingleOrderAndGetOrderId() throws Exception {
        String body = """
                {
                  "userId": 5000,
                                                                        "flightId": 2000,
                  "cabinType": "ECONOMY",
                  "ticketNum": 1,
                  "passengerName": "Alice"
                }
                """;

        String resp = mockMvc.perform(post("/api/v1/orders")
                        .contentType(APPLICATION_JSON)
                        .header("X-User-Type", "1")
                        .content(body))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(resp);
        assertEquals(0, json.get("code").asInt());
        long parentOrderId = Long.parseLong(json.get("data").get("orderNo").asText());

        List<Orders> rows = orderMapper.selectList(Wrappers.<Orders>lambdaQuery()
                .eq(Orders::getParentOrderId, parentOrderId));
        assertEquals(1, rows.size());
        return rows.get(0).getOrderId();
    }
}
