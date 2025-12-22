package com.team.skylink.user;

import com.team.skylink.module.user.service.InMemorySessionStore;
import com.team.skylink.module.user.service.SessionIdentity;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class InMemorySessionStoreTests {
    @Test
    void create_and_resolve() {
        InMemorySessionStore store = new InMemorySessionStore();
        String t1 = store.createSession(1L, 1);
        String t2 = store.createSession(2L, 2);
        SessionIdentity s1 = store.resolve(t1);
        SessionIdentity s2 = store.resolve(t2);
        assertEquals(1L, s1.userId());
        assertEquals(1, s1.userType());
        assertEquals(2L, s2.userId());
        assertEquals(2, s2.userType());
    }

    @Test
    void resolve_blank() {
        InMemorySessionStore store = new InMemorySessionStore();
        assertNull(store.resolve(""));
        assertNull(store.resolve(null));
    }
}

