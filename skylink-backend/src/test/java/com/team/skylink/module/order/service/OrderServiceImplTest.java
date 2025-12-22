package com.team.skylink.module.order.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.common.Result;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.mapper.RouteMapper;
import com.team.skylink.module.flight.service.SeatService;
import com.team.skylink.module.order.dto.CreateOrderRequest;
import com.team.skylink.module.order.dto.OrderSearchResponse;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.user.mapper.UserMapper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderMapper orderMapper;
    @Mock
    private FlightMapper flightMapper;
    @Mock
    private AircraftCabinConfigMapper configMapper;
    @Mock
    private RouteMapper routeMapper;
    @Mock
    private UserMapper userMapper;
    @Mock
    private SeatService seatService;

    @InjectMocks
    private OrderServiceImpl orderService;

    @BeforeEach
    void setup() {
        // Init MyBatis Plus TableInfo for LambdaWrapper
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), Orders.class);
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), AircraftCabinConfig.class);
    }

    /**
     * 1. 联程航班下单测试
     * 验证要点：
     * - orderMapper.insert() 被调用 2 次
     * - parent_order_id 相同且不为 null
     * - trip_type 分别为 1 (首段) 和 2 (后段)
     */
    @Test
    void testCreateMultiSegmentOrder() {
        // Arrange
        CreateOrderRequest req = new CreateOrderRequest();
        req.setUserId(100L);
        req.setTicketNum(1);
        req.setCabinType("ECONOMY");
        req.setPassengerName("Test User");
        req.setContactEmail("test@example.com");
        req.setFlightNos(Arrays.asList("FL001", "FL002"));

        // Mock Flights
        Flight f1 = new Flight();
        f1.setFlightId(1L);
        f1.setFlightNo("FL001");
        f1.setModelId(10L);
        f1.setRouteId(100L);
        f1.setDepartureCity("Beijing");
        f1.setArrivalCity("Shanghai");

        Flight f2 = new Flight();
        f2.setFlightId(2L);
        f2.setFlightNo("FL002");
        f2.setModelId(10L);
        f2.setRouteId(101L);
        f2.setDepartureCity("Shanghai");
        f2.setArrivalCity("New York");

        // Use sequential return for repeated calls in loop
        when(flightMapper.selectOne(any(QueryWrapper.class))).thenReturn(f1, f2);

        // Mock Config
        AircraftCabinConfig config = new AircraftCabinConfig();
        config.setConfigId(50L);
        config.setCapacity(100);
        config.setCabinCoefficient(new BigDecimal("1.0"));
        lenient().when(configMapper.selectOne(any())).thenReturn(config);

        // Mock Inventory
        lenient().when(orderMapper.selectCount(any())).thenReturn(0L);

        // Mock Route
        Route r1 = new Route();
        r1.setBasePrice(new BigDecimal("1000"));
        Route r2 = new Route();
        r2.setBasePrice(new BigDecimal("2000"));
        lenient().when(routeMapper.selectById(100L)).thenReturn(r1);
        lenient().when(routeMapper.selectById(101L)).thenReturn(r2);

        // Mock Insert
        lenient().when(orderMapper.insert(any(Orders.class))).thenReturn(1);

        // Act
        Result<OrderSearchResponse> result = orderService.create(req);

        // Assert
        assertEquals(0, result.getCode());
        ArgumentCaptor<Orders> orderCaptor = ArgumentCaptor.forClass(Orders.class);
        verify(orderMapper, times(2)).insert(orderCaptor.capture());

        List<Orders> savedOrders = orderCaptor.getAllValues();
        assertEquals(2, savedOrders.size());

        Orders o1 = savedOrders.get(0);
        Orders o2 = savedOrders.get(1);

        assertNotNull(o1.getParentOrderId(), "Parent Order ID should not be null");
        assertEquals(o1.getParentOrderId(), o2.getParentOrderId(), "Parent Order IDs should match");

        assertEquals(1, o1.getTripType(), "First segment trip type should be 1");
        assertEquals(2, o2.getTripType(), "Second segment trip type should be 2");
    }

    /**
     * 事务测试：模拟第二次 insert 抛异常
     */
    @Test
    void testCreateMultiSegmentOrder_TransactionRollback() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setUserId(100L);
        req.setTicketNum(1);
        req.setCabinType("ECONOMY");
        req.setPassengerName("Test User");
        req.setFlightNos(Arrays.asList("FL001", "FL002"));

        Flight f1 = new Flight(); f1.setFlightId(1L); f1.setFlightNo("FL001"); f1.setModelId(10L); f1.setRouteId(100L);
        Flight f2 = new Flight(); f2.setFlightId(2L); f2.setFlightNo("FL002"); f2.setModelId(10L); f2.setRouteId(101L);
        
        when(flightMapper.selectOne(any(QueryWrapper.class))).thenReturn(f1, f2);

        AircraftCabinConfig config = new AircraftCabinConfig(); 
        config.setConfigId(50L); 
        config.setCapacity(100); 
        config.setCabinCoefficient(BigDecimal.ONE);
        lenient().when(configMapper.selectOne(any())).thenReturn(config);
        
        lenient().when(orderMapper.selectCount(any())).thenReturn(0L);
        
        Route r1 = new Route(); r1.setBasePrice(BigDecimal.TEN);
        lenient().when(routeMapper.selectById(anyLong())).thenReturn(r1);

        // Simulate failure on second insert
        when(orderMapper.insert(any(Orders.class)))
                .thenReturn(1)
                .thenThrow(new RuntimeException("Database connection failed"));

        // Verify exception is thrown (which triggers @Transactional rollback in real runtime)
        assertThrows(RuntimeException.class, () -> orderService.create(req));
    }

    /**
     * 2. 管理员审核流程测试 (通过)
     */
    @Test
    void testAuditPass_Interline() {
        Long orderId = 1000L;
        Long parentOrderId = 9999L;
        
        Orders childOrder = new Orders();
        childOrder.setOrderId(orderId);
        childOrder.setParentOrderId(parentOrderId);
        childOrder.setOrderStatus(0); // Pending

        when(orderMapper.selectById(orderId)).thenReturn(childOrder);

        // Act
        orderService.audit(orderId, true);

        // Assert
        ArgumentCaptor<LambdaUpdateWrapper<Orders>> captor = ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
        verify(orderMapper).update(eq(null), captor.capture());
    }

    /**
     * 2. 管理员审核流程测试 (拒绝)
     */
    @Test
    void testAuditReject_Single() {
        Long orderId = 2000L;
        
        Orders order = new Orders();
        order.setOrderId(orderId);
        order.setParentOrderId(null);
        order.setOrderStatus(0);

        when(orderMapper.selectById(orderId)).thenReturn(order);

        // Act
        orderService.audit(orderId, false);

        // Assert
        assertEquals(3, order.getOrderStatus()); // 3 = Rejected
        verify(orderMapper).updateById(order);
    }

    /**
     * 3. 动态库存超卖模拟 (并发测试)
     */
    @Test
    void testConcurrency_InventoryCheck() throws InterruptedException {
        int threadCount = 10;
        CountDownLatch latch = new CountDownLatch(threadCount);
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        CreateOrderRequest req = new CreateOrderRequest();
        req.setFlightNo("FL999");
        req.setTicketNum(1);
        req.setUserId(1L);
        req.setCabinType("ECO");
        req.setPassengerName("P");

        Flight f = new Flight(); f.setFlightId(99L); f.setFlightNo("FL999"); f.setModelId(1L); f.setRouteId(1L);
        AircraftCabinConfig config = new AircraftCabinConfig(); 
        config.setConfigId(1L); 
        config.setCapacity(100); // Enough capacity
        config.setCabinCoefficient(BigDecimal.ONE);
        Route r = new Route(); r.setBasePrice(BigDecimal.TEN);

        // Relaxed stubbing for concurrency
        lenient().when(flightMapper.selectOne(any())).thenReturn(f);
        lenient().when(configMapper.selectOne(any())).thenReturn(config);
        lenient().when(routeMapper.selectById(any())).thenReturn(r);
        lenient().when(orderMapper.insert(any(Orders.class))).thenReturn(1);

        // Mock selectCount to simulate concurrent reads
        AtomicInteger callCount = new AtomicInteger(0);
        when(orderMapper.selectCount(any())).thenAnswer(inv -> {
            callCount.incrementAndGet();
            return 0L; 
        });

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    orderService.create(req);
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        // Verify that selectCount was called at least 10 times (once per thread)
        verify(orderMapper, atLeast(10)).selectCount(any());
    }
}
