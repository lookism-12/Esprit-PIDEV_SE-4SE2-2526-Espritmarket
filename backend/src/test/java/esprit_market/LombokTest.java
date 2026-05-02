package esprit_market;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test to verify Lombok is working correctly
 */
@Slf4j
public class LombokTest {

    @Test
    public void testLombokDataAnnotation() {
        TestDTO dto = new TestDTO();
        dto.setName("Test");
        dto.setValue(123);
        
        assertEquals("Test", dto.getName());
        assertEquals(123, dto.getValue());
        
        log.info("✅ Lombok @Data annotation is working!");
    }

    @Test
    public void testLombokBuilderAnnotation() {
        TestDTO dto = TestDTO.builder()
                .name("Builder Test")
                .value(456)
                .build();
        
        assertEquals("Builder Test", dto.getName());
        assertEquals(456, dto.getValue());
        
        log.info("✅ Lombok @Builder annotation is working!");
    }

    @Test
    public void testLombokSlf4jAnnotation() {
        assertNotNull(log);
        log.info("✅ Lombok @Slf4j annotation is working!");
    }

    @Test
    public void testLombokAllArgsConstructor() {
        TestDTO dto = new TestDTO("Constructor Test", 789);
        
        assertEquals("Constructor Test", dto.getName());
        assertEquals(789, dto.getValue());
        
        log.info("✅ Lombok @AllArgsConstructor annotation is working!");
    }

    /**
     * Test DTO class with Lombok annotations
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    static class TestDTO {
        private String name;
        private Integer value;
    }
}
